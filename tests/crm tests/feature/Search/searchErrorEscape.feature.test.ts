import { test, expect } from '@fixtures/CrmFixtures';
import { SEARCH_RETRY_TERM } from '../../../../src/data/search.data';

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

test.describe('Escape after successful search retry', () => {
    test.use({ role: 'rep' });

    test('AIO-T205: Escape closes search after successful retry and restores opener focus @regression', async ({
        crmLoginPage, dashboardPage, searchPage
    }) => {
        await crmLoginPage.goto();
        await dashboardPage.waitForDashBoardPage();
        await searchPage.failSearchRequests();
        await searchPage.openErrorSearchFromHeader(SEARCH_RETRY_TERM);
        await searchPage.restoreSearchRequestsAndAssertSuccessfulRetry(SEARCH_RETRY_TERM);
        await searchPage.assertEscapeFromCurrentFocusRestoresOpener();
        await searchPage.assertEscapeFromInputRestoresFocus();
        await searchPage.failSearchRequests();
        await searchPage.openErrorSearchFromHeader(SEARCH_RETRY_TERM);
        await searchPage.assertEscapeFromRetryRestoresFocus();
    });
});
