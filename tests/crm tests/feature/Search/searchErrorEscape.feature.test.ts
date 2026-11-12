import { test, expect } from '@fixtures/CrmFixtures';

test('AIO-T79: Escape closes search from focused error actions and restores header focus @smoke @regression', async ({
    crmLoginPage,
    dashboardPage,
    searchPage
}) => {
    await crmLoginPage.goto();
    await dashboardPage.waitForDashBoardPage();
    await searchPage.failSearchRequests();
    await searchPage.openErrorSearchWithShortcut();
    await searchPage.assertEscapeFromRetryRestoresFocus();
    await searchPage.openErrorSearchFromHeader();
    await searchPage.assertRetryKeepsTermAndFocus();
    await searchPage.assertEscapeFromCloseRestoresFocus();
    await searchPage.assertEscapeFromInputRestoresFocus();
});
