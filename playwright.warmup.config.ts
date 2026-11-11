import { defineConfig } from '@playwright/test';

// No global setup: the CRM must be warm before API data setup runs.
// Install Playwright browsers before test:warmup: warmUpPage uses BaseFixtures.page.
// Offline probes use no network or credentials; the fixture still launches a browser.
export default defineConfig({
  testDir: './tests/crm tests/feature/WarmUp',
  testMatch: '**/*.feature.test.ts',
  // test:warmup runs the offline probes; scripts/warm-up.js sets WARMUP_LIVE=1 for the real warm-up.
  // One grep only: a CLI --grep is applied on top of this one, so both tags would be required (no tests found).
  grep: process.env.WARMUP_LIVE === '1' ? /@warmup-live/ : /@warmup-offline/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  use: { headless: true, trace: 'off', screenshot: 'off', video: 'off' },
  reporter: [['list'], ['junit', { outputFile: 'reports/junit/warm-up-results.xml' }]],
});
