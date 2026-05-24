import { defineConfig, devices } from '@playwright/test';
import { EnvManager } from './src/utils/EnvManager';

const env = EnvManager.getInstance();

export default defineConfig({
  // ─── Test Directory ───────────────────────────────────────────────
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  // ─── Global Settings ──────────────────────────────────────────────
  timeout: env.timeout,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // retries: process.env.CI ? 2 : env.retries,
  workers: process.env.CI ? 1 : env.workers,

  // ─── Global Setup / Teardown ──────────────────────────────────────
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

 // ─── Reporters ────────────────────────────────────────────────────
reporter: [

  ['list'],

  ['html', {
    outputFolder: 'playwright-report',
    open: 'never'
  }],

  ['json', {
    outputFile: 'reports/json-report/results.json'
  }],

  ['junit', {
    outputFile: 'reports/junit/results.xml'
  }],

  ['./src/reporters/CustomReporter.ts'],
],

// ─── Output ───────────────────────────────────────────────────────
outputDir: 'test-results',

  // ─── Shared Use Options ───────────────────────────────────────────
  use: {
    baseURL: env.baseUrl,
    headless: env.headless,
    // slowMo: env.slowMo,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  },

  // ─── Projects ─────────────────────────────────────────────────────
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // }
  ],
});
