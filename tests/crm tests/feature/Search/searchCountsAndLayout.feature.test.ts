import { test } from '@fixtures/CrmFixtures';
import {
    COUNT_TERM, COUNT_TOTALS, FIRST_RESULT_URL, HIDDEN_CONTACT_TERM, NO_MATCH_TERM, REP_EMAIL, SEE_ALL_LABELS,
    SHORT_TERM, SHORT_TERM_HINT, STAGE_ONLY_TERM, VIEWER_EMAIL, VIEWPORTS, noMatchesHeading,
} from '../../../../src/data/search.data';

test.describe('AIO-211 Global search counts, highlights and layout', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage, searchPage }) => {
        searchPage.trackSearchActivity();
        await crmLoginPage.goto();
        await crmLoginPage.loginWithCustomCredentials(REP_EMAIL);
        await dashboardPage.waitForDashBoardPage();
    });

    test('AIO-T102: Search shows API-derived counts, highlights and See all (Sales Rep) @smoke @regression', async ({ searchPage }) => {
        await searchPage.openSearch();
        await searchPage.typeAndAwaitApi(COUNT_TERM);
        await searchPage.assertGroupsAndRows(COUNT_TOTALS);
        await searchPage.assertFooterMatchesApi();
        await searchPage.assertSeeAll(SEE_ALL_LABELS);
    });

    test('AIO-T103: Deals match and highlight by name only @regression', async ({ searchPage }) => {
        await searchPage.openSearch();
        await searchPage.typeAndAwaitApi(COUNT_TERM);
        await searchPage.assertDealHighlightsNameOnly(COUNT_TOTALS.deals);
        await searchPage.typeAndAwaitApi(STAGE_ONLY_TERM);
        await searchPage.assertNoMatches(STAGE_ONLY_TERM, noMatchesHeading(STAGE_ONLY_TERM));
    });

    test('AIO-T104: Minimum length, empty state and Clear search @regression', async ({ searchPage }) => {
        await searchPage.openSearch();
        await searchPage.typeWithoutApi(SHORT_TERM);
        await searchPage.assertShortTermHint(SHORT_TERM_HINT);
        await searchPage.typeAndAwaitApi(NO_MATCH_TERM);
        await searchPage.assertNoMatches(NO_MATCH_TERM, noMatchesHeading(NO_MATCH_TERM));
        await searchPage.clearSearchFromEmptyState();
    });

    test('AIO-T105: Responsive layout and keyboard use at 375, 768, 1440 px @regression', async ({ searchPage }) => {
        await searchPage.setViewport(VIEWPORTS.phone);
        await searchPage.openSearch();
        await searchPage.typeAndAwaitApi(COUNT_TERM);
        await searchPage.assertNoHorizontalOverflow();
        await searchPage.assertClearButtonTouchTarget();
        for (const size of [VIEWPORTS.tablet, VIEWPORTS.desktop]) {
            await searchPage.setViewport(size);
            await searchPage.assertResultsPanelShown();
            await searchPage.assertNoHorizontalOverflow();
        }
        await searchPage.openFirstResultWithKeyboard(FIRST_RESULT_URL);
        searchPage.assertNoConsoleErrors();
    });
});

test.describe('AIO-211 Viewer search visibility', () => {
    test('AIO-T106: Viewer sees no email/phone and cannot search by them @regression', async ({ crmLoginPage, dashboardPage, searchPage }) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithCustomCredentials(VIEWER_EMAIL);
        await dashboardPage.waitForDashBoardPage();
        await searchPage.openSearch();
        await searchPage.typeAndAwaitApi(COUNT_TERM);
        await searchPage.assertFooterMatchesApi();
        await searchPage.assertRowsHideContactDetails('contacts');
        await searchPage.typeAndAwaitApi(HIDDEN_CONTACT_TERM);
        await searchPage.assertNoMatches(HIDDEN_CONTACT_TERM, noMatchesHeading(HIDDEN_CONTACT_TERM));
    });
});
