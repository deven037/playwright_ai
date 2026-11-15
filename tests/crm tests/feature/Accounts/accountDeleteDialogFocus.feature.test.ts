import { test } from '@fixtures/CrmFixtures';
import { DELETE_DIALOG_FOCUS } from '../../../../src/data/accounts.data';

test.use({ trace: 'on-first-retry' });

test('AIO-T236: Delete dialog focus moves in, is trapped, returns to Delete trigger @regression', async ({
  crmLoginPage, dashboardPage, accountsPage,
}) => {
  const { accountId, tabPresses, dismissals } = DELETE_DIALOG_FOCUS;
  await crmLoginPage.goto();
  await dashboardPage.waitForDashBoardPage();
  await accountsPage.openDeleteRegressionAccount(accountId);

  // Steps 1-3: opens with the keyboard, focus moves in, stays trapped, description is referenced
  const name = await accountsPage.openDeleteDialogWithKeyboard();
  await accountsPage.assertFocusInsideDeleteDialog();
  await accountsPage.assertTabKeepsFocusInDeleteDialog(tabPresses);
  await accountsPage.assertTabKeepsFocusInDeleteDialog(tabPresses, true);
  await accountsPage.assertDeleteDialogDescribedByBody();

  // Step 4: every dismissal returns focus to Delete and leaves the account unchanged
  for (const [index, how] of dismissals.entries()) {
    if (index > 0) await accountsPage.reopenDeleteDialog();
    await accountsPage.dismissDeleteDialog(how);
    await accountsPage.assertFocusReturnedToDeleteTrigger(accountId, name);
  }
});
