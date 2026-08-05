import { Locator, Page, test } from '@playwright/test';
import { EnvManager } from '../utils/EnvManager';
import { Logger } from '../utils/Logger';
import { GroqProvider } from './providers/GroqProvider';
import { LLMProvider, ProviderUnavailableError } from './providers/LLMProvider';
import { ExploreContext, ExploreTool, HealRequest, HealResult, HealingEvent } from '../types/healing';

const EXPLORE_TOOLS: ExploreTool[] = [
  {
    name: 'get_snapshot',
    description: "Get the current page's accessibility tree, with each element tagged [ref=eN]. Call this first.",
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'inspect_element',
    description:
      'Inspect a candidate ref: returns its tag, data-testid/id/class/role, visible text, placeholder, bounding box, and visibility. Use this to verify a candidate before committing.',
    parameters: {
      type: 'object',
      properties: { ref: { type: 'string', description: 'The ref, e.g. "e3", from a previous snapshot' } },
      required: ['ref'],
    },
  },
  {
    name: 'scroll_into_view',
    description: 'Scroll a candidate ref into view and re-check its visibility. Use if a candidate might be off-screen.',
    parameters: {
      type: 'object',
      properties: { ref: { type: 'string', description: 'The ref to scroll into view' } },
      required: ['ref'],
    },
  },
  {
    name: 'propose_selector',
    description: 'Finish the search and propose your final choice. Call this exactly once, when confident.',
    parameters: {
      type: 'object',
      properties: {
        ref: { type: 'string', description: 'The ref of the single best-matching element' },
        confidence: { type: 'number', description: 'Confidence from 0 to 1' },
        reasoning: { type: 'string', description: 'Short explanation of why this element matches' },
      },
      required: ['ref', 'confidence', 'reasoning'],
    },
  },
];

interface EventInput {
  req: HealRequest;
  testTitle: string;
  originalLocator: string;
  success: boolean;
  healedLocator?: string;
  provider?: string;
  exploreRounds?: number;
  confidence?: number;
  reasoning?: string;
  errorMessage?: string;
}

/**
 * Runtime fallback for locator timeouts: explores the live page with an LLM
 * tool-calling loop, resolves + validates a candidate, and derives a stable
 * selector for reporting. Never writes back to page-object source files.
 */
export class SelfHealingEngine {
  private static instance: SelfHealingEngine;

  private readonly env = EnvManager.getInstance();
  private readonly logger = Logger.getInstance();
  private readonly providers: LLMProvider[];
  private roundRobinIndex = 0;
  private readonly cache = new Map<string, string>();

  private constructor() {
    const registry: Record<string, LLMProvider> = {
      groq: new GroqProvider(this.env.groqApiKey, this.env.groqModel),
    };
    this.providers = this.env.aiHealingProviderOrder
      .map((name) => registry[name])
      .filter((p): p is LLMProvider => !!p && p.isConfigured());
  }

  static getInstance(): SelfHealingEngine {
    if (!SelfHealingEngine.instance) SelfHealingEngine.instance = new SelfHealingEngine();
    return SelfHealingEngine.instance;
  }

  isEnabled(): boolean {
    return this.env.aiHealingEnabled && this.providers.length > 0;
  }

  async heal(req: HealRequest): Promise<HealResult> {
    const testTitle = this.safeTestTitle();
    const originalSelector = req.locator.toString();
    const cacheKey = `${testTitle}::${originalSelector}`;

    if (this.env.aiHealingCache && this.cache.has(cacheKey)) {
      const cachedSelector = this.cache.get(cacheKey)!;
      const validated = await this.validateCandidate(req.page.locator(cachedSelector));
      if (validated) {
        const event = this.buildEvent({
          req, testTitle, originalLocator: originalSelector, success: true, healedLocator: cachedSelector,
        });
        this.recordEvent(event);
        return { healed: true, healedLocator: validated, event };
      }
      this.cache.delete(cacheKey);
    }

    const context: ExploreContext = {
      originalSelector,
      description: req.description,
      action: req.action,
    };

    const errors: string[] = [];
    for (let attempt = 0; attempt < this.providers.length; attempt++) {
      const provider = this.providers[(this.roundRobinIndex + attempt) % this.providers.length];
      let exploreRounds = 0;

      if (attempt > 0) {
        this.logger.info(`AI Self healing: retrying with a different provider...`);
      }

      try {
        const proposal = await provider.runExploreLoop(
          context,
          EXPLORE_TOOLS,
          async (name, args) => {
            exploreRounds++;
            this.logger.info(`AI Self healing in process, fetching correct locator... (attempt ${exploreRounds}/${this.env.aiHealingMaxExploreRounds})`);
            return this.executeTool(req.page, name, args);
          },
          this.env.aiHealingMaxExploreRounds,
        );
        this.roundRobinIndex = (this.roundRobinIndex + attempt + 1) % this.providers.length;

        if (!proposal || !proposal.ref) {
          errors.push(`${provider.name}: no proposal returned within ${this.env.aiHealingMaxExploreRounds} rounds`);
          continue;
        }

        const resolved = await this.validateCandidate(req.page.locator(`aria-ref=${proposal.ref}`));
        if (!resolved) {
          errors.push(`${provider.name}: proposed ref "${proposal.ref}" did not resolve to a visible element`);
          continue;
        }

        const stableSelector = await this.deriveStableSelector(resolved);
        const finalValidated = await this.validateCandidate(req.page.locator(stableSelector));
        const healedLocator = finalValidated ?? resolved;
        const healedSelector = finalValidated ? stableSelector : `aria-ref=${proposal.ref}`;

        if (this.env.aiHealingCache) this.cache.set(cacheKey, healedSelector);

        const event = this.buildEvent({
          req, testTitle, originalLocator: originalSelector, success: true,
          healedLocator: healedSelector, provider: provider.name,
          exploreRounds, confidence: proposal.confidence, reasoning: proposal.reasoning,
        });
        this.recordEvent(event);
        return { healed: true, healedLocator, event };
      } catch (err) {
        if (err instanceof ProviderUnavailableError) {
          errors.push(`${provider.name} unavailable: ${err.message}`);
        } else {
          errors.push(`${provider.name} error: ${(err as Error).message}`);
        }
      }
    }

    const event = this.buildEvent({
      req, testTitle, originalLocator: originalSelector, success: false,
      errorMessage: errors.length > 0 ? errors.join(' | ') : req.originalError.message,
    });
    this.recordEvent(event);
    return { healed: false, event };
  }

  private async executeTool(page: Page, name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case 'get_snapshot': {
        // mode: 'ai' is required - it's what makes the snapshot include [ref=eN] tags
        // that aria-ref=eN locators can resolve. Without it, refs aren't emitted at all.
        const snapshot = await page.locator('body').ariaSnapshot({ mode: 'ai', timeout: 3000 });
        return this.truncateSnapshot(snapshot);
      }
      case 'inspect_element': {
        const ref = String(args.ref ?? '');
        const loc = page.locator(`aria-ref=${ref}`);
        if ((await loc.count()) === 0) return { error: 'ref not found' };
        return loc.first().evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return {
            tag: el.tagName.toLowerCase(),
            dataTestId: el.getAttribute('data-testid'),
            id: el.id || null,
            className: el.className || null,
            role: el.getAttribute('role'),
            text: (el.textContent || '').trim().slice(0, 200),
            placeholder: el.getAttribute('placeholder'),
            visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
            boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          };
        });
      }
      case 'scroll_into_view': {
        const ref = String(args.ref ?? '');
        const loc = page.locator(`aria-ref=${ref}`);
        if ((await loc.count()) === 0) return { error: 'ref not found' };
        await loc.first().scrollIntoViewIfNeeded();
        return { visible: await loc.first().isVisible() };
      }
      default:
        return { error: `unknown tool: ${name}` };
    }
  }

  private truncateSnapshot(snapshot: string, maxChars = 15000): string {
    if (snapshot.length <= maxChars) return snapshot;
    return `${snapshot.slice(0, maxChars)}\n... (truncated, ${snapshot.length - maxChars} more chars)`;
  }

  /** Never trust a proposed ref blindly: must resolve to exactly one visible, actionable element. */
  private async validateCandidate(locator: Locator): Promise<Locator | null> {
    try {
      const count = await locator.count();
      if (count === 0) return null;
      const scoped = count > 1 ? locator.first() : locator;
      await scoped.waitFor({ state: 'visible', timeout: this.env.aiHealingTimeoutMs });
      return scoped;
    } catch {
      return null;
    }
  }

  /** Builds a conventional, human-portable selector from the resolved element - not the ephemeral aria-ref. */
  private async deriveStableSelector(locator: Locator): Promise<string> {
    return locator.evaluate((el) => {
      const testId = el.getAttribute('data-testid');
      if (testId) return `[data-testid='${testId}']`;
      if (el.id) return `#${el.id}`;
      const name = el.getAttribute('name');
      if (name) return `${el.tagName.toLowerCase()}[name='${name}']`;
      const role = el.getAttribute('role');
      const text = (el.textContent || '').trim();
      if (role && text && !text.includes("'") && !text.includes('"')) {
        return `role=${role}[name="${text.slice(0, 80)}"]`;
      }
      return el.tagName.toLowerCase();
    });
  }

  private safeTestTitle(): string {
    try {
      return test.info().title;
    } catch {
      return 'unknown-test';
    }
  }

  private buildEvent(input: EventInput): HealingEvent {
    return {
      timestamp: new Date().toISOString(),
      testTitle: input.testTitle,
      action: input.req.action,
      description: input.req.description,
      originalLocator: input.originalLocator,
      healedLocator: input.healedLocator,
      provider: input.provider,
      exploreRounds: input.exploreRounds,
      confidence: input.confidence,
      reasoning: input.reasoning,
      success: input.success,
      errorMessage: input.errorMessage,
    };
  }

  private recordEvent(event: HealingEvent): void {
    try {
      test.info().attach('ai-healing-event', {
        body: Buffer.from(JSON.stringify(event)),
        contentType: 'application/json',
      });
    } catch {
      this.logger.warn(`Healing event could not be attached to test report: ${JSON.stringify(event)}`);
    }
  }
}
