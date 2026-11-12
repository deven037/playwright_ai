import { test } from '../../../../src/fixtures/CrmFixtures';

/**
 * New Application - Feature Test Suite (SCAFFOLD)
 *
 * TODO before writing real tests:
 *   1. Set NEWAPP_BASE_URL (and NEWAPP_USERNAME / NEWAPP_PASSWORD if needed)
 *      in your .env file.
 *   2. Build page objects under src/pages/newApp/ (see the README.md there)
 *      and wire them into src/fixtures/NewAppFixtures.ts.
 *   3. Replace the test below with real @feature tests, following the
 *      naming convention used by the existing app
 *      (e.g. "@feature TC_NEWAPP_001 - Should ...").
 */

// The login form is the subject here, so start signed out instead of from the saved admin session.
test.use({ role: 'anonymous' });

test('@feature @smoke @regression CRM Login - Should log in with default credentials', async ({ crmLoginPage, dashboardPage }) => {
  
  await crmLoginPage.goto();
  await crmLoginPage.loginWithDefaultCredentials();

  await dashboardPage.waitForDashBoardPage();
  await dashboardPage.assertProfileIconVisible();
});
