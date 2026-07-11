import { test as base, Page, BrowserContext } from '@playwright/test';
import { Logger } from '../utils/Logger';

const logger = Logger.getInstance();

/**
 * BaseFixtures
 *
 * Shared, app-agnostic fixtures: a fresh BrowserContext + Page per test.
 * Every app-specific fixture file (e.g. PageFixtures.ts for the existing
 * automationteststore.com app, NewAppFixtures.ts for the new app) extends
 * this `test` rather than redefining context/page setup itself.
 *
 * To add support for another application:
 *   1. Create `src/fixtures/<AppName>Fixtures.ts`
 *   2. `import { test as base } from './BaseFixtures'`
 *   3. `base.extend<YourPageFixtures>({ ...page object fixtures... })`
 */
export type BaseFixtures = {
  context: BrowserContext;
  page: Page;
};

export const test = base.extend<BaseFixtures>({
  context: async ({ browser }, use) => {
    logger.info('Creating fresh browser context for test');
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
    });
    await use(context);
    logger.info('Closing browser context after test');
    await context.close();
  },

  page: async ({ context }, use) => {
    logger.info('Creating fresh page in context');
    const page = await context.newPage();
    await use(page);
  },
});

export { expect } from '@playwright/test';
