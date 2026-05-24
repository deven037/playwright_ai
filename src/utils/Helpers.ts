import { Page, Locator, expect } from '@playwright/test';
import { Logger } from './Logger';
import { WaitStrategy } from '../types';

/**
 * Helpers — Collection of reusable utility methods for test automation.
 * Provides wrappers for common Playwright actions with logging.
 */
export class Helpers {
  private readonly logger = Logger.getInstance();

  constructor(private readonly page: Page) {}

  // ─── Navigation ───────────────────────────────────────────────────────────

  async navigateTo(url: string): Promise<void> {
    this.logger.step(`Navigate to: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  async click(locator: Locator, description = ''): Promise<void> {
    this.logger.step(`Click: ${description || locator.toString()}`);
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  async fill(locator: Locator, value: string, description = ''): Promise<void> {
    this.logger.step(`Fill "${value}" into: ${description || locator.toString()}`);
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(value);
  }

  async selectOption(locator: Locator, value: string, description = ''): Promise<void> {
    this.logger.step(`Select "${value}" in: ${description || locator.toString()}`);
    await locator.selectOption(value);
  }

  async uploadFile(locator: Locator, filePath: string): Promise<void> {
    this.logger.step(`Upload file: ${filePath}`);
    await locator.setInputFiles(filePath);
  }

  // ─── Waits ────────────────────────────────────────────────────────────────

  async waitForElement(locator: Locator, state: WaitStrategy = 'visible', timeout = 15000): Promise<void> {
    await locator.waitFor({ state, timeout });
  }

  async waitForURL(urlPattern: string | RegExp): Promise<void> {
    this.logger.step(`Waiting for URL: ${urlPattern}`);
    await this.page.waitForURL(urlPattern, { timeout: 30000 });
  }

  // ─── Assertions ───────────────────────────────────────────────────────────

  async assertVisible(locator: Locator, message?: string): Promise<void> {
    this.logger.step(`Assert visible: ${message ?? ''}`);
    await expect(locator).toBeVisible();
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

  // ─── Utilities ────────────────────────────────────────────────────────────

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
    this.logger.info(`📸  Screenshot saved: ${name}.png`);
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
