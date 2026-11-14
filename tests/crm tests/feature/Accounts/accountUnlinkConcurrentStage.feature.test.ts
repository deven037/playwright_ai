import { test, expect } from '@fixtures/CrmFixtures';
import { MOVE_DEAL, MOVE_DEAL_ID, MOVE_FROM_STAGE, MOVE_TO_STAGE } from '../../../../src/data/deals.data';

test.use({ role: 'admin', trace: 'on-first-retry' });

test('AIO-T207: Unlinking an unrelated empty account preserves a concurrently saved deal stage @regression', async ({
  crmLoginPage, accountsPage, dealsTab,
}) => {
  await accountsPage.assertStagingForConcurrentDelete();
  await crmLoginPage.goto();
  let accountName: string | undefined;
  let moveAttempted = false;
  try {
    // Tab A loads the account before tab B changes the deal, preserving the stale-cache reproduction.
    await accountsPage.openNewAccountForm();
    accountName = await accountsPage.fillGeneratedAccountName();
    await accountsPage.createAccount();
    expect(await accountsPage.getAccountNameFromDetailsPage()).toBe(accountName);

    await dealsTab.openStagingBoardInNewTab();
    await dealsTab.assertDealInStage(MOVE_DEAL, MOVE_FROM_STAGE);
    moveAttempted = true;
    await dealsTab.moveDealAndAssertSaved(MOVE_DEAL, MOVE_DEAL_ID, MOVE_TO_STAGE);

    await accountsPage.deleteUnrelatedAccountAndAssertOnlyDelete();
    await dealsTab.reload();
    await dealsTab.assertDealInStage(MOVE_DEAL, MOVE_TO_STAGE);
    await dealsTab.assertDealNotInStage(MOVE_DEAL, MOVE_FROM_STAGE);
  } finally {
    try {
      if (moveAttempted) await dealsTab.restoreDealStage(MOVE_DEAL, MOVE_FROM_STAGE);
    } finally {
      if (accountName) await accountsPage.deleteAccountIfExists(accountName);
    }
  }
});
