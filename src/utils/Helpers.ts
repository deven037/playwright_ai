import { Page, Locator, expect } from '@playwright/test';
import { Logger } from './Logger';
import { WaitStrategy } from '../types';
import { SelfHealingEngine } from '../ai/SelfHealingEngine';
import { HealableAction } from '../types/healing';

/**
 * Helpers - Collection of reusable utility methods for test automation.
 * Provides wrappers for common Playwright actions with logging.
 */
export class Helpers {
  private readonly logger = Logger.getInstance();
  private readonly healer = SelfHealingEngine.getInstance();

  constructor(private readonly page: Page) {}

  // --- Navigation -----------------------------------------------------------

  async navigateTo(url: string): Promise<void> {
    this.logger.step(`Navigate to: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  // --- Self-healing dispatcher ------------------------------------------------

  private isTimeoutError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;
    if (err.name === 'TimeoutError') return true;
    // expect(locator).toBeVisible() failures throw an ExpectError (not TimeoutError),
    // but the matcher has no other failure mode - any failure here means the element
    // never resolved as visible within the timeout, same condition as a locator TimeoutError.
    return err.constructor.name === 'ExpectError' && err.message.includes('toBeVisible');
  }

  /**
   * Runs `perform` against `locator`; on a locator timeout (only), attempts an
   * AI-driven heal and re-runs the same action closure against the healed
   * locator. Never swallows non-timeout errors, and never swallows a failed heal.
   */
  private async runWithHealing(
    locator: Locator,
    description: string,
    action: HealableAction,
    perform: (loc: Locator) => Promise<void>,
  ): Promise<void> {
    try {
      await perform(locator);
    } catch (err) {
      if (!this.isTimeoutError(err) || !this.healer.isEnabled()) throw err;
      const label = description || locator.toString();
      this.logger.warn(`Incorrect locator: ${label}`);
      this.logger.info(`AI Self healing in process, fetching correct locator...`);
      const result = await this.healer.heal({ page: this.page, locator, description, action, originalError: err as Error });
      if (!result.healed || !result.healedLocator) {
        this.logger.warn(`AI Self healing failed to find a correct locator for: ${label}`);
        throw err;
      }
      this.logger.info(`AI Self healing found correct locator: ${result.event.healedLocator}`);
      await perform(result.healedLocator);
    }
  }

  // --- Actions -------------------------------------------------------------

  async click(locator: Locator, description = ''): Promise<void> {
    this.logger.step(`Click: ${description || locator.toString()}`);
    await this.runWithHealing(locator, description, 'click', async (loc) => {
      await loc.waitFor({ state: 'visible' });
      await loc.click();
    });
  }

  async fill(locator: Locator, value: string, description = ''): Promise<void> {
    this.logger.step(`Fill "${value}" into: ${description || locator.toString()}`);
    await this.runWithHealing(locator, description, 'fill', async (loc) => {
      await loc.waitFor({ state: 'visible' });
      await loc.clear();
      await loc.fill(value);
    });
  }

  async fillWithReturn(locator: Locator, value: string, description = ''): Promise<string> {
    this.logger.step(`Fill "${value}" into: ${description || locator.toString()}`);
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(value);
    return value;
  }

  async pressKey(locator: Locator, key: string, description = ''): Promise<void> {
    this.logger.step(`Press "${key}" in: ${description || locator.toString()}`);
    await locator.press(key);
  }

  async selectOption(locator: Locator, value: string, description = ''): Promise<void> {
    this.logger.step(`Select "${value}" in: ${description || locator.toString()}`);
    await this.runWithHealing(locator, description, 'selectOption', async (loc) => {
      await loc.selectOption(value);
    });
  }

  async uploadFile(locator: Locator, filePath: string): Promise<void> {
    this.logger.step(`Upload file: ${filePath}`);
    await locator.setInputFiles(filePath);
  }

  // --- Waits ----------------------------------------------------------------

  async waitForElement(locator: Locator, state: WaitStrategy = 'visible', description = ''): Promise<void> {
    // Only 'visible'/'attached' timeouts mean "element not found" - healing looks for a
    // replacement element, which makes no sense when waiting for one to disappear.
    if (state === 'hidden' || state === 'detached') {
      await locator.waitFor({ state });
      return;
    }
    await this.runWithHealing(locator, description, 'waitForElement', async (loc) => {
      await loc.waitFor({ state });
    });
  }

  async waitForURL(urlPattern: string | RegExp): Promise<void> {
    this.logger.step(`Waiting for URL: ${urlPattern}`);
    await this.page.waitForURL(urlPattern, { timeout: 30000 });
  }

  // --- Assertions -----------------------------------------------------------

  async assertVisible(locator: Locator, message?: string): Promise<void> {
    this.logger.step(`Assert visible: ${message ?? ''}`);
    await this.runWithHealing(locator, message ?? '', 'assertVisible', async (loc) => {
      await expect(loc).toBeVisible();
    });
  }

  async assertText(locator: Locator, expectedText: string): Promise<void> {
    this.logger.step(`Assert text: "${expectedText}"`);
    await expect(locator).toContainText(expectedText);
  }

  async assertURL(expected: string | RegExp): Promise<void> {
    this.logger.step(`Assert URL contains: ${expected}`);
    await expect(this.page).toHaveURL(expected);
  }

  async assertTitle(expected: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expected);
  }

  // --- Utilities ------------------------------------------------------------

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
    this.logger.info(`  Screenshot saved: ${name}.png`);
  }

  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) ?? '';
  }

  async getAttributeValue(locator: Locator, attribute: string): Promise<string | null> {
    return locator.getAttribute(attribute);
  }

  async isElementPresent(locator: Locator): Promise<boolean> {
    return (await locator.count()) > 0;
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async refreshPage(): Promise<void> {
    await this.page.reload({ waitUntil: 'networkidle' });
  }

  /** Generates a random string of given length */
  static randomString(length = 8): string {
    return Math.random().toString(36).substring(2, 2 + length);
  }

  /** Generates a random email */
  static randomEmail(domain = 'testmail.com'): string {
    return `auto_${Helpers.randomString(6)}@${domain}`;
  }

  /** Formats a date as YYYY-MM-DD */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
