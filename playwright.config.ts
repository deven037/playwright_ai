import { defineConfig, devices } from '@playwright/test';
import { EnvManager } from './src/utils/EnvManager';

const env = EnvManager.getInstance();

// ─── Environment Detection ────────────────────────────────────────────────────
const isCI         = !!process.env.CI;                        // Set by Jenkins / GitHub Actions
const isDebug      = !!process.env.PWDEBUG || !!process.env.DEBUG_MODE; // Local debug flag

// ─── Smart Worker Calculation ─────────────────────────────────────────────────
// CI    : fixed 4 workers, capped to actual test count at runtime by Playwright
// Debug : always 1 (respects test.only, step-through debugging)
// Local : from .env (default 2)
const resolveWorkers = (): number | undefined => {
  if (isDebug) return 1;
  if (isCI)    return 4;
  return env.workers;
};

// ─── Reporter Configuration ───────────────────────────────────────────────────
// CI    : junit (for Jenkins test results plugin) + json + custom (no HTML open)
// Local : list + html (auto-open on failure) + custom
const resolveReporters = (): any[] => {
  if (isCI) {
    return [
      // JUnit XML — consumed by Jenkins 'Publish JUnit test result report' plugin
      ['junit', {
        outputFile:          'reports/junit/results.xml',
        suiteName:           'Playwright AI Framework',
        includeProjectInTestName: true,
      }],
      // JSON — consumed by custom dashboards / downstream jobs
      ['json',  { outputFile: 'reports/json-report/results.json' }],
      // Custom reporter — CI mode (no ANSI, injects Jenkins build metadata)
      ['./src/reporters/CustomReporter.ts'],
    ];
  }

  return [
    // Human-readable live output
    ['list'],
    // Playwright HTML report — never auto-open on local (run `npm run report` manually)
    ['html',  { outputFolder: 'reports/html-report', open: 'never' }],
    // JSON for quick scripting
    ['json',  { outputFile: 'reports/json-report/results.json' }],
    // Custom reporter — local mode (full ANSI color, no Jenkins metadata)
    ['./src/reporters/CustomReporter.ts'],
  ];
};

// ─── Playwright Config ────────────────────────────────────────────────────────
export default defineConfig({
  testDir:   './tests',
  testMatch: '**/*.spec.ts',

  // ─── Timeouts ───────────────────────────────────────────────────────────────
  timeout:          env.timeout,
  expect:           { timeout: 10000 },

  // ─── Parallelism ────────────────────────────────────────────────────────────
  // fullyParallel: false  → tests within a file run sequentially (safe for ordered flows)
  // workers        → smart resolution: debug=1, CI=4 (capped to test count), local=.env value
  // Playwright automatically caps workers to the number of tests,
  // so if only 1 test exists it will use 1 worker regardless of the workers value.
  fullyParallel: false,
  workers:       resolveWorkers(),

  // ─── Reliability ────────────────────────────────────────────────────────────
  // forbidOnly: blocks accidental test.only merges to CI
  forbidOnly: isCI,
  retries:    isCI ? 2 : env.retries,

  // ─── Global Hooks ───────────────────────────────────────────────────────────
  globalSetup:    './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  // ─── Reporters ──────────────────────────────────────────────────────────────
  reporter: resolveReporters(),

  // ─── Artifacts Output ───────────────────────────────────────────────────────
  outputDir: 'test-results',

  // ─── Shared Browser Options ─────────────────────────────────────────────────
  use: {
    baseURL:           env.baseUrl,
    // CI always headless; local reads from .env (default false = headed)
    headless:          isCI ? true : env.headless,
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    trace:             'retain-on-failure',
    actionTimeout:     15000,
    navigationTimeout: 30000,
    viewport:          { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  },

  // ─── Projects ───────────────────────────────────────────────────────────────
  // CI and local both run Chromium only (as per requirement).
  // Other browsers commented out — uncomment to enable cross-browser.
  projects: [
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'] },
    },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari']  } },
  ],
});
