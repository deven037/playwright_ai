import { expect, test } from "@fixtures/CrmFixtures";

test.use({ authRole: 'admin' });

test('@regression Verify Deal Deletion from detail page', async ({
    crmLoginPage,
    dashboardPage,
    dealsPage
}) => {
    const dealName = `Deal_${Date.now()}`;

    await dashboardPage.waitForDashBoardPage();
    await dashboardPage.assertProfileIconVisible();

    await dealsPage.gotoDeals();
    await dealsPage.clickNewDeal();
    await dealsPage.fillDealDetails(dealName, '1000');
    await dealsPage.createDeal();
    expect(await dealsPage.getDealNameFromDetailsPage()).toBe(dealName);

    await dealsPage.clickDeleteDeal();
    await dealsPage.confirmDeleteDeal();

    await dealsPage.gotoDeals();
    await expect(await dealsPage.getDealCardLocator(dealName)).toHaveCount(0);
});
