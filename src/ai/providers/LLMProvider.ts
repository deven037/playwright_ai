import { ExploreContext, ExploreTool, ProposedSelector } from '../../types/healing';

/**
 * A provider drives one multi-turn "explore, then decide" tool-calling loop
 * against an LLM. It never touches Playwright directly - `executeTool` (owned
 * by SelfHealingEngine) is the only bridge to the live page, so providers stay
 * swappable/testable independent of the browser.
 */
export interface LLMProvider {
  readonly name: string;

  isConfigured(): boolean;

  runExploreLoop(
    context: ExploreContext,
    tools: ExploreTool[],
    executeTool: (name: string, args: Record<string, unknown>) => Promise<unknown>,
    maxRounds: number,
  ): Promise<ProposedSelector | null>;
}

/** Thrown by providers on 429/quota/auth failures so the engine can fail over to the next provider. */
export class ProviderUnavailableError extends Error {
  constructor(public readonly providerName: string, message: string) {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}

export const SYSTEM_PROMPT = `You are a Playwright locator-repair assistant embedded in a test automation framework.
A test step failed because its locator could not find the intended element on the page.
You are given the original (now-broken) selector, a human description of what the element is for, and the action being attempted.
You have tools to explore the CURRENT live page and find the correct replacement element.
Use get_snapshot to see the page's accessibility tree. Use inspect_element to examine a candidate ref's attributes/text/visibility before committing - especially if multiple elements could plausibly match the description. Use scroll_into_view if a candidate might be off-screen.
Do not guess blindly - inspect at least one candidate before calling propose_selector, and inspect more than one if the snapshot shows multiple plausible matches (e.g. duplicate labels, generic containers, repeated list rows).
When confident, call propose_selector exactly once with the ref of the single best-matching element, a confidence score from 0 to 1, and a short reasoning string.`;
