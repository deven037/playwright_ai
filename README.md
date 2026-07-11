# Playwright AI Framework

Production-grade end-to-end automation framework built with **Playwright + TypeScript**, targeting [automationteststore.com](https://automationteststore.com).

---

## Architecture

```
playwright_ai/
+-- src/
|   +-- core/           # BasePage - abstract OOP base for all page objects
|   +-- fixtures/       # BaseFixtures (shared context/page) + per-app fixture files
|   |   +-- BaseFixtures.ts      # shared fresh-context/page fixture, extended by app fixtures
|   |   +-- PageFixtures.ts      # automationteststore.com page object wiring
|   |   +-- NewAppFixtures.ts    # SCAFFOLD - new application page object wiring
|   +-- pages/           # Page Object classes
|   |   +-- newApp/              # SCAFFOLD - new application's page objects (empty, see README.md inside)
|   +-- reporters/      # CustomReporter - CI/Local aware HTML + JSON reporter
|   +-- types/          # Shared TypeScript interfaces
|   +-- utils/          # EnvManager, AuthManager, Logger, Helpers
+-- tests/
|   +-- api/            # Pure API tests (no browser, uses request fixture)
|   +-- e2e/            # Full multi-page user journeys (page objects)
|   +-- feature/         # Smaller, single-module flows (login, registration)
|   +-- newApp/          # SCAFFOLD - new application's tests (api/e2e/feature, all skipped placeholders)
+-- auth/                # storageState.json output (currently unused by fixtures)
+-- global-setup.ts
+-- global-teardown.ts
+-- playwright.config.ts
+-- Jenkinsfile
+-- .gitlab-ci.yml
+-- .github/workflows/pr-playwright.yml
```

### Page Objects (`src/pages`)
- `login.page.ts` - login, error states, success assertions
- `registration.page.ts` - random user generation + account creation
- `home.page.ts` - top navigation / sub-menu hovering
- `products.page.ts` - product selection, add-to-cart
- `cart.page.ts` - cart totals, checkout, order confirmation
- `orderConfirmation.page.ts` - order ID, invoice retrieval

### Utilities (`src/utils`)
- `EnvManager` - singleton, typed accessor for all `.env` values (also reads `API_BASE_URL` / `AUTH_API`, used by the API tests - see note below)
- `Logger` - Winston-based singleton; logs to console and to `logs/automation.log` / `logs/errors.log`
- `Helpers` - reusable click/fill/wait/assert wrappers plus static random string/email/date generators
- `AuthManager` - storage-state save/load/clear helpers for session reuse. **Not currently wired into `PageFixtures`** - each test still gets a brand-new, unauthenticated browser context, so this utility is available but unused today.

---

## Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd playwright_ai

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install chromium

# 4. Configure environment
cp .env.example .env
# Edit .env with your BASE_URL, APP_USERNAME, APP_PASSWORD
```

> `EnvManager` reads `API_BASE_URL` and `AUTH_API` (used by `tests/api/*`) in addition to `BASE_URL` - all three are in `.env.example`.

---

## Running Tests

```bash
npm test                    # Run all tests
npm run test:smoke          # --grep @smoke   (see "Tagging" note below)
npm run test:regression     # --grep @regression
npm run test:sanity         # --grep @sanity
npm run test:headed         # Headed browser (visible)
npm run test:debug          # Debug mode - 1 worker, headed
npm run test:ci             # CI simulation locally (chromium project)
npm run test:ui             # Playwright UI mode
npm run codegen             # Playwright codegen recorder
npm run test:newapp         # Run only the new application's tests (tests/newApp)
npm run report              # Open Playwright HTML report
npm run report:custom       # Open the custom dark-themed HTML summary
npm run clean               # Clear test-results, reports, logs, and auth
```

Only a single `chromium` project is currently configured in `playwright.config.ts` (no Firefox/WebKit project exists yet, even though `EnvManager`/`.env` expose a `BROWSER` variable).

---

## Tagging Strategy

Tags actually present in test titles today:

| Tag | Used in | Purpose |
|---|---|---|
| `@api` | `tests/api/*` | Pure API checks via the `request` fixture |
| `@e2e` | `tests/e2e/*` | Full multi-page user journeys |
| `@feature` | `tests/feature/*` | Smaller, single-module flows |

> **Gap:** `package.json` defines `test:smoke`, `test:regression`, and `test:sanity` scripts (`--grep @smoke` etc.), and the Jenkinsfile's `SUITE` parameter offers `smoke`/`sanity`/`regression` choices, but no test title currently contains `@smoke`, `@regression`, or `@sanity`. Running those scripts today matches zero tests. Add the tags to the relevant `test()` titles (e.g. `login.feature.test.ts` already documents an intent to be `@smoke @regression @login` in its file header comment, but the tags were never added to the actual test name) to make them functional.

---

## CI/CD

Three pipeline definitions exist side by side:

| Pipeline | Trigger | Notes |
|---|---|---|
| `.github/workflows/pr-playwright.yml` | PR opened/synced against `main`/`master`/`develop`, or manual dispatch | Installs Chromium, runs `npm run test:ci`, uploads `playwright-report/`, `test-results/`, `reports/` as artifacts |
| `.gitlab-ci.yml` | Scheduled pipelines or manual web trigger only | Runs in the official `mcr.microsoft.com/playwright` image, publishes JUnit results and artifacts (5-day expiry) |
| `Jenkinsfile` | Manual/parameterized | Windows agent (`bat` steps), parameters for `SUITE`, `SPEC`, `GREP`, `CLEAN_REPORTS`; copies a local `.env` into the workspace; publishes JUnit + Playwright HTML report |

Credentials are never hardcoded - Jenkins reads `.env` from the local machine, while GitHub Actions/GitLab CI are expected to use repo/CI-level secrets.

---

## Adding a New Application

The framework now supports more than one application side by side. A scaffold
for a second app already exists (search for `newApp`/`NewApp`/`NEWAPP` to find
every touchpoint, and rename them to the real app name once it's known):

| What | Where |
|---|---|
| Page objects | `src/pages/newApp/` (empty - see the `README.md` inside for the pattern) |
| Fixture wiring | `src/fixtures/NewAppFixtures.ts` (extends the shared `BaseFixtures.ts`) |
| Tests | `tests/newApp/api/`, `tests/newApp/e2e/`, `tests/newApp/feature/` (one skipped placeholder test in each) |
| Env vars | `NEWAPP_BASE_URL`, `NEWAPP_USERNAME`, `NEWAPP_PASSWORD` in `.env.example` / `EnvManager` |
| Run just this app | `npm run test:newapp` |

To activate it once you have the URL:
1. Fill in `NEWAPP_BASE_URL` (and credentials, if needed) in your `.env`.
2. Build page objects under `src/pages/newApp/`, extending `BasePage` the same way the existing pages do.
3. Wire those page objects into `src/fixtures/NewAppFixtures.ts` (the file already has the exact pattern commented in).
4. Replace the three placeholder `test.skip(...)` calls in `tests/newApp/*` with real tests.

This pattern - a dedicated fixture file extending `BaseFixtures`, a dedicated `src/pages/<app>/` folder, and a dedicated `tests/<app>/` folder - is also how you'd add a third application later.

---

## Environment Variables

| Variable | Description | In `.env.example`? |
|---|---|---|
| `BASE_URL` | Application under test URL | Yes |
| `API_BASE_URL` | Base URL for `tests/api/methods.api.test.ts` | **No - missing** |
| `AUTH_API` | Base URL for `tests/api/auth.api.test.ts` | **No - missing** |
| `APP_USERNAME` | Login username | Yes |
| `APP_PASSWORD` | Login password | Yes |
| `HEADLESS` | `true` / `false` | Yes |
| `BROWSER` | `chromium` / `firefox` / `webkit` (only `chromium` project currently wired up) | Yes |
| `SLOW_MO` | Slow-motion delay in ms | Yes |
| `TIMEOUT` | Global test timeout (ms) | Yes |
| `RETRIES` | Retry count on failure | Yes |
| `WORKERS` | Parallel workers (local) | Yes |
| `NEWAPP_BASE_URL` | New application URL (SCAFFOLD, fill in once known) | Yes |
| `NEWAPP_USERNAME` | New application login username (SCAFFOLD) | Yes |
| `NEWAPP_PASSWORD` | New application login password (SCAFFOLD) | Yes |

---

## Reports

| Report | Location |
|---|---|
| Playwright HTML | `playwright-report/index.html` |
| Custom dark-themed HTML summary | `reports/custom-report/summary.html` |
| Custom JSON | `reports/custom-report/report.json` |
| Playwright JSON | `reports/json-report/results.json` |
| JUnit XML (CI) | `reports/junit/results.xml` |

All HTML/JSON/JUnit reporters run together via the multi-reporter config in `playwright.config.ts`; the custom reporter additionally prints a colorized live summary to the console and enriches its HTML/JSON output with Jenkins build metadata when `CI=true`.

---

## Known Gaps / TODO

- `@smoke`, `@regression`, `@sanity` tags are referenced by npm scripts and the Jenkins `SUITE` parameter but aren't applied to any test titles yet.
- `AuthManager` (storage-state save/reuse) is implemented but not consumed by `PageFixtures` - every test still logs in from scratch in a fresh context.
- Only a `chromium` Playwright project is defined; Firefox/WebKit are not yet set up despite the `BROWSER` env var existing.
- The new application scaffold (`src/pages/newApp/`, `NewAppFixtures.ts`, `tests/newApp/*`) has no real page objects or tests yet - it's intentionally just folders/wiring until the app URL is available.
