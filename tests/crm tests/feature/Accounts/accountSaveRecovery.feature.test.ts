import { test, expect } from '@fixtures/CrmFixtures';
import { ACCOUNT_SAVE } from '../../../../src/data/accounts.data';

test.use({ trace: 'on-first-retry' });
test.describe.configure({ retries: 0 });

test.beforeEach(async ({ crmLoginPage, dashboardPage, accountsPage }) => {
  await crmLoginPage.goto();
  await crmLoginPage.loginWithDefaultCredentials();
  await dashboardPage.waitForDashBoardPage();
  await accountsPage.openCreateForm(ACCOUNT_SAVE.name);
});

test('AIO-T150: HTTP 500 restores create button and keeps entries @feature @regression', async ({ accountsPage }) => {
  await accountsPage.rejectAccountSaves(500);
  await accountsPage.submitAndAssertStatus(500);
  await accountsPage.assertRejectedSave(ACCOUNT_SAVE.name);
});

test('AIO-T151: network failure and 422 restore create button and banner @feature @regression', async ({ accountsPage }) => {
  await accountsPage.rejectAccountSaves('abort');
  await accountsPage.createAccount();
  await accountsPage.assertRejectedSave(ACCOUNT_SAVE.name);
  await accountsPage.rejectAccountSaves(422);
  await accountsPage.submitAndAssertStatus(422);
  await accountsPage.assertRejectedSave(ACCOUNT_SAVE.name);
});

test('AIO-T152: retry creates account and form fits supported widths @feature @regression', async ({ accountsPage }) => {
  await accountsPage.rejectAccountSaves(500);
  await accountsPage.submitAndAssertStatus(500);
  await accountsPage.assertRejectedSave(ACCOUNT_SAVE.name);
  await accountsPage.assertNoOverflowAtWidths(ACCOUNT_SAVE.widths);
  await accountsPage.retryAndAssertCreated();
  expect(await accountsPage.getAccountNameFromDetailsPage()).toBe(ACCOUNT_SAVE.name);
  await accountsPage.deleteAccount();
  await accountsPage.confirmDelete();
});
