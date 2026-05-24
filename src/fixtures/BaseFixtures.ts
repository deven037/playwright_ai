import { test as base, Page, BrowserContext } from '@playwright/test';
import { AuthManager } from '../utils/AuthManager';
import { Logger } from '../utils/Logger';
import { Helpers } from '../utils/Helpers';
import { EnvManager } from '../utils/EnvManager';

const logger  = Logger.getInstance();
const authMgr = AuthManager.getInstance();
const env     = EnvManager.getInstance();

// ─── Base Fixture Types ───────────────────────────────────────────────────────
// Infrastructure-only fixtures: browser contexts, pages, helpers.
// Page object fixtures live in PageFixtures.ts.

export type BaseFixtures = {
  /** Fresh unauthenticated page — use for login, registration, public pages */
  unauthenticatedPage: Page;
  /** Authenticated page — reuses storageState session when available */
  authenticatedPage: Page;
  /** Raw browser context — use when you need full context control */
  baseContext: BrowserContext;
  /** Helpers utility bound to the default Playwright `page` fixture */
  helpers: Helpers;
};

// ─── Base Test Object ─────────────────────────────────────────────────────────

export const base_test = base.extend<BaseFixtures>({

  // ── Unauthenticated Page ──────────────────────────────────────────────────
  unauthenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    await page.goto(env.baseUrl, { waitUntil: 'domcontentloaded' });
    await use(page);
    await context.close();
  },

  // ── Authenticated Page ────────────────────────────────────────────────────
  authenticatedPage: async ({ browser }, use) => {
    let context: BrowserContext;

    if (authMgr.hasSavedSession()) {
      logger.info('🔑  Reusing saved auth session (storageState)');
      context = await browser.newContext({
        storageState: authMgr.getAuthFilePath(),
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
      });
    } else {
      logger.info('🔐  No saved session — performing fresh login');
      context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
      });
      const loginPage = await context.newPage();
      await authMgr.login(loginPage);
      await authMgr.saveSession(context);
      await loginPage.close();
    }

    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // ── Base Context ──────────────────────────────────────────────────────────
  baseContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
    });
    await use(context);
    await context.close();
  },

  // ── Helpers ───────────────────────────────────────────────────────────────
  helpers: async ({ page }, use) => {
    await use(new Helpers(page));
  },
});

export { expect } from '@playwright/test';
