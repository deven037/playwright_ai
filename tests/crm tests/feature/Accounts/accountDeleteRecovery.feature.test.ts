import { test } from '@fixtures/CrmFixtures';
import { ACCOUNT_DELETE } from '../../../../src/data/accounts.data';

test.use({ trace: 'on-first-retry' });

test('AIO-T198: Open-deal account deletion returns 409 without writes in both cascade modes and roles @regression', async ({
  crmLoginPage, dashboardPage, accountsPage,
}) => {
  test.setTimeout(180000);
  await crmLoginPage.goto();
  await dashboardPage.waitForDashBoardPage();
  await accountsPage.assertOpenDealDeleteHasNoWritesForBothRoles();
});

test('AIO-T199: Account delete blocks open deals and recovers from rejected delete and retry @regression', async ({
  crmLoginPage, dashboardPage, accountsPage,
}) => {
  await crmLoginPage.goto();
  await dashboardPage.waitForDashBoardPage();
  await accountsPage.openDeleteRegressionAccount(ACCOUNT_DELETE.blockedId);
  await accountsPage.assertOpenDealDeleteBlocked();

  await accountsPage.openDeleteRegressionAccount(ACCOUNT_DELETE.emptyId);
  try {
    await accountsPage.rejectEmptyAccountDeletes();
    await accountsPage.openEmptyAccountDeleteDialog();
    await accountsPage.confirmRejectedAccountDelete();
    await accountsPage.assertRejectedDeleteRecovery(1);
    await accountsPage.confirmRejectedAccountDelete();
    await accountsPage.assertRejectedDeleteRecovery(2);
    await accountsPage.cancelRejectedAccountDelete();
  } finally {
    await accountsPage.stopRejectingAccountDeletes();
  }
});
