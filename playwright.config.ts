import { defineConfig, devices } from '@playwright/test';
import { EnvManager } from './src/utils/EnvManager';

const env = EnvManager.getInstance();

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.test.ts',

  timeout: env.timeout,
  expect: { timeout: 10000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 4 : env.workers,

  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report',
      trace: 'on',
      open: 'never',
      attachmentsFolder: 'test-results/attachments'
    }],
    ['json', {
      outputFile: 'reports/json-report/results.json',
      attachmentsFolder: 'test-results/attachments'
    }],
    ['junit', {
      outputFile: 'reports/junit/results.xml'
    }],
    ['./src/reporters/CustomReporter.ts', {
      outputFile: 'reports/custom-report/results.txt',
      trace: 'on',
      attachmentsFolder: 'test-results/attachments'
    }],
  ],

  outputDir: 'test-results',

  use: {
    baseURL: env.baseUrl,
    headless: env.headless,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
});