# Playwright AI Framework

Production-grade end-to-end automation framework built with **Playwright + TypeScript**.

---

## Architecture

```
playwright_ai/
+-- src/
|   +-- core/           # BasePage (abstract OOP base)
|   +-- fixtures/       # BaseFixtures + PageFixtures (page injection)
|   +-- pages/          # Page Object classes
|   +-- reporters/      # Custom CI/Local aware reporter
|   +-- types/          # Shared TypeScript interfaces
|   +-- utils/          # EnvManager, AuthManager, Logger, Helpers
+-- tests/              # Spec files
+-- global-setup.ts
+-- global-teardown.ts
+-- playwright.config.ts
+-- Jenkinsfile
```

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

---

## Running Tests

```bash
npm test                    # Run all tests
npm run test:smoke          # @smoke tests only
npm run test:regression     # @regression tests only
npm run test:headed         # Headed browser (visible)
npm run test:debug          # Debug mode - 1 worker, headed
npm run test:ci             # CI simulation locally
npm run report              # Open Playwright HTML report
npm run clean               # Clear results, reports, logs
```

---

## Tagging Strategy

| Tag | Purpose |
|---|---|
| `@smoke` | Critical path - fast feedback |
| `@regression` | Full coverage |
| `@sanity` | Post-deploy quick checks |
| `@login`, `@cart`, etc. | Module-specific runs |

---

## Jenkins Pipeline

The `Jenkinsfile` supports parameterized runs:

| Parameter | Description |
|---|---|
| `SUITE` | `smoke` / `regression` / `sanity` / `all` |
| `SPEC` | Path to specific spec file |
| `GREP` | Tag/pattern filter |
| `CLEAN_REPORTS` | Wipe previous reports before run |

Credentials are managed via **Jenkins Credentials Store** - never hardcoded.

---

## Environment Variables

| Variable | Description |
|---|---|
| `BASE_URL` | Application under test URL |
| `APP_USERNAME` | Login username |
| `APP_PASSWORD` | Login password |
| `HEADLESS` | `true` / `false` |
| `BROWSER` | `chromium` / `firefox` / `webkit` |
| `TIMEOUT` | Global test timeout (ms) |
| `RETRIES` | Retry count on failure |
| `WORKERS` | Parallel workers (local) |

---

## Reports

| Report | Location |
|---|---|
| Custom HTML Summary | `reports/custom-report/summary.html` |
| Playwright HTML | `reports/html-report/index.html` |
| JUnit XML (CI) | `reports/junit/results.xml` |
| JSON | `reports/json-report/results.json` |
