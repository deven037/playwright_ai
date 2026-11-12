import { test } from "@fixtures/CrmFixtures";

test('AIO-T23: Dashboard "view all activity" link opens the Activity view @feature @smoke @regression', async ({
    crmLoginPage,
    dashboardPage
}) => {
    await crmLoginPage.goto();
    await dashboardPage.waitForDashBoardPage();

    // Step 1: it is a link with href /activity
    await dashboardPage.assertViewAllActivityIsLink();

    // Step 2: activating it opens the Activity view
    await dashboardPage.openViewAllActivity();
    await dashboardPage.assertActivityViewOpen();

    // Step 3: "Back to Dashboard" returns to the Dashboard
    await dashboardPage.clickBackToDashboard();
    await dashboardPage.assertDashboardUrl();
    await dashboardPage.waitForDashBoardPage();
});
