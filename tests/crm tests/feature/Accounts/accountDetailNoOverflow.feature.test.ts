import { test } from "@fixtures/CrmFixtures";
import { NARROW_VIEWPORT } from "../../../../src/data/accounts.data";

test('AIO-T145: Account detail has no horizontal overflow at 375 px @smoke @regression', async ({
    crmLoginPage,
    dashboardPage,
    accountsPage
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();

    // Step 1: 375x900 viewport, open the account detail page
    await accountsPage.setNarrowViewport();
    await accountsPage.openOverflowAccountDetail();
    await accountsPage.assertDetailPageFitsViewport(NARROW_VIEWPORT.width);
});
