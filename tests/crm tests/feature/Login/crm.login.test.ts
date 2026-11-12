import { test } from '@fixtures/CrmFixtures';
import { LOGIN_EMAIL_DATA } from '../../../../src/data/login.data';

// The login form is the subject here, so start signed out instead of from the saved admin session.
test.use({ role: 'anonymous', trace: 'on-first-retry' });

test('@feature @smoke @regression CRM Login - Should log in with default credentials', async ({ crmLoginPage, dashboardPage }) => {
  
  await crmLoginPage.goto();
  await crmLoginPage.loginWithDefaultCredentials();

  await dashboardPage.waitForDashBoardPage();
  await dashboardPage.assertProfileIconVisible();
});

test('AIO-T6: EMAIL_PATTERN accepts valid email addresses @feature @smoke', async ({ crmLoginPage }) => {
  await crmLoginPage.goto();
  await crmLoginPage.assertLoginFormVisible();
  await crmLoginPage.validateEmailFormat(LOGIN_EMAIL_DATA.valid);
  await crmLoginPage.assertEmailAccepted();
  await crmLoginPage.validateEmailFormat(LOGIN_EMAIL_DATA.validTagged);
  await crmLoginPage.assertEmailAccepted();
});

test('AIO-T7: EMAIL_PATTERN rejects malformed and edge case addresses @feature @regression', async ({ crmLoginPage }) => {
  await crmLoginPage.goto();
  await crmLoginPage.assertLoginFormVisible();
  await crmLoginPage.validateEmailFormat(LOGIN_EMAIL_DATA.missingDomain);
  await crmLoginPage.assertEmailRejected(LOGIN_EMAIL_DATA.formatError);
  await crmLoginPage.validateEmailFormat(LOGIN_EMAIL_DATA.missingTopLevelDomain);
  await crmLoginPage.assertEmailRejected(LOGIN_EMAIL_DATA.formatError);
  await crmLoginPage.validateEmailFormat(LOGIN_EMAIL_DATA.missingLocalPart);
  await crmLoginPage.assertEmailRejected(LOGIN_EMAIL_DATA.formatError);
  await crmLoginPage.validateEmailFormat(LOGIN_EMAIL_DATA.valid);
  await crmLoginPage.assertEmailAccepted();
});
