import { test } from "@fixtures/CrmFixtures";

test('AIO-T12: Dashboard activity and design gaps @feature @regression', async ({
    crmLoginPage,
    dashboardPage
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();

    // Step 1: feed is focusable and named
    await dashboardPage.assertActivityFeedAccessible();

    // Step 2: keyboard focus and scroll
    await dashboardPage.scrollActivityFeedWithKeyboard();

    // Step 4: linked tiles and range chip
    await dashboardPage.assertLinkedTiles();
    await dashboardPage.assertRangeChipVisible();

    // Step 3: "view all activity" is keyboard reachable and routes to the Activity view
    await dashboardPage.openViewAllActivityWithKeyboard();
    await dashboardPage.assertActivityViewOpen();
});
