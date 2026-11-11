import { Page, expect } from '@playwright/test';
import { Logger } from '../utils/Logger';
import { Helpers } from '../utils/Helpers';
import { EnvManager } from '../utils/EnvManager';

/**
 * BasePage - Abstract base class for all Page Object classes.
 *
 * Every page class MUST extend BasePage.
 * Provides shared infrastructure: page, helpers, logger, env, and common methods.
 *
 * OOP Principles applied:
 *  - Abstraction   : enforces `waitForPageLoad()` contract on all pages
 *  - Encapsulation : exposes only necessary methods; internals are protected/private
 *  - Inheritance   : all page objects inherit shared behavior
 *  - Polymorphism  : each page implements its own `waitForPageLoad()`
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly helpers: Helpers;
  protected readonly logger = Logger.getInstance();
  protected readonly env = EnvManager.getInstance();

  constructor(page: Page) {
    this.page = page;
    this.helpers = new Helpers(page);
  }

  /**
   * Abstract method - every page must implement its own load verification.
   * Called automatically to confirm the page has loaded correctly.
   */
  abstract waitForPageLoad(): Promise<any>;

  // --- Common Navigation ---------------------------------------------------

  /** Navigate to the application base URL */
  async navigateToBase(): Promise<void> {
    this.logger.step('Navigate to base URL');
    await this.page.goto(this.env.baseUrl, { waitUntil: 'networkidle' });
  }

  /** Navigate to a relative path under base URL */
  async navigateTo(relativePath: string): Promise<void> {
    const url = `${this.env.baseUrl}${relativePath}`;
    this.logger.step(`Navigate to: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  // --- Common Utilities ----------------------------------------------------

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.helpers.takeScreenshot(name);
  }

  // async scrollToTop(): Promise<void> {
  //   await this.page.evaluate(() => window.scrollTo(0, 0));
  // }

  // async scrollToBottom(): Promise<void> {
  //   await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  // }

  async acceptDialog(): Promise<void> {
    this.page.on('dialog', (dialog) => dialog.accept());
  }

  async dismissDialog(): Promise<void> {
    this.page.on('dialog', (dialog) => dialog.dismiss());
  }

  // --- Responsive layout ---------------------------------------------------

  async setViewport(width: number, height: number): Promise<void> {
    this.logger.step(`Set viewport ${width}x${height}`);
    await this.page.setViewportSize({ width, height });
  }

  /** Page-level horizontal overflow check: scrollWidth must equal clientWidth, both equal to the viewport width. */
  async assertNoHorizontalOverflow(width: number): Promise<void> {
    await expect.poll(
      () => this.page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      })),
      { message: `scrollWidth and clientWidth should both be ${width}` },
    ).toEqual({ scrollWidth: width, clientWidth: width });
  }
}
