import { defineConfig } from '@playwright/test';

// No global setup: the CRM must be warm before API data setup runs.
// Install Playwright browsers before test:warmup: warmUpPage uses BaseFixtures.page.
// Offline probes use no network or credentials; the fixture still launches a browser.
// No `grep` here: a CLI --grep is applied on top of a config grep (both must match), so a config
// grep of @warmup-offline made `warm-up.js --grep @warmup-live` find no tests. Each caller passes its own.
export default defineConfig({
  testDir: './tests/crm tests/feature/WarmUp',
  testMatch: '**/*.feature.test.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  use: { headless: true, trace: 'off', screenshot: 'off', video: 'off' },
  reporter: [['list'], ['junit', { outputFile: 'reports/junit/warm-up-results.xml' }]],
});
