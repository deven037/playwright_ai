import { test } from "@fixtures/CrmFixtures";
import { SEARCH_ERROR_TERM } from '../../../../src/data/search.data';

test('AIO-T79: Escape closes search from focused error actions and restores header focus @smoke @regression', async ({
    crmLoginPage,
    dashboardPage,
    searchPage
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();

    // The live API now succeeds; force the error precondition without changing server data.
    await searchPage.failSearchRequests();

    await searchPage.openWithShortcutFromHeader();
    await searchPage.typeTerm(SEARCH_ERROR_TERM);
    await searchPage.assertSearchFailedWithRetryFocused();
    await searchPage.pressEscape();
    await searchPage.assertClosedWithOpenerFocused();

    // Nearby regression: header opening, retry retains the term, and Esc bubbles from Close.
    await searchPage.openFromHeader();
    await searchPage.typeTerm(SEARCH_ERROR_TERM);
    await searchPage.assertRetryFocused();
    await searchPage.retrySearch();
    await searchPage.assertRetryCompletedKeepingTerm(SEARCH_ERROR_TERM);
    await searchPage.focusClose();
    await searchPage.pressEscape();
    await searchPage.assertClosedWithOpenerFocused();

    await searchPage.openFromHeader();
    await searchPage.assertInputFocused();
    await searchPage.pressEscape();
    await searchPage.assertClosedWithOpenerFocused();
});
