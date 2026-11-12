import { expect, test } from "@fixtures/CrmFixtures";

test('@smoke @regression Verify Deal Creation', async ({
    crmLoginPage,
    dashboardPage,
    dealsPage
}) => {
    const dealName = `Deal_${Date.now()}`;

    await crmLoginPage.goto();
    await dashboardPage.waitForDashBoardPage();
    await dashboardPage.assertProfileIconVisible();

    await dealsPage.gotoDeals();
    await dealsPage.clickNewDeal();
    await dealsPage.fillDealDetails(dealName, '25000');
    await dealsPage.createDeal();

    expect(await dealsPage.getDealNameFromDetailsPage()).toBe(dealName);
    expect(await dealsPage.getDealStageFromDetailsPage()).toBe('Qualification');

    await dealsPage.gotoDeals();
    await expect(await dealsPage.getDealCardLocator(dealName)).toBeVisible();
});
