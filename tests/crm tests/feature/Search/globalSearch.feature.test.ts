import { test, expect } from '@fixtures/CrmFixtures';

test.describe('Global search', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage }) => {
        await crmLoginPage.goto();
        await dashboardPage.waitForDashBoardPage();
    });

    test('AIO-T80: header button and Ctrl+K open labelled search @smoke', async ({ searchPage }) => {
        await searchPage.assertHeaderButtonAndShortcut();
    });

    test('AIO-T81: minimum term, grouped totals, See all and record navigation @smoke', async ({ searchPage }) => {
        await searchPage.assertMinimumAndLiveGroupedNavigation();
    });

    test('AIO-T82: keyboard, loading, empty, error, retry and Escape @regression', async ({ searchPage }) => {
        await searchPage.assertMinimumDebounceAndKeyboard();
        await searchPage.assertLoadingErrorRetryAndEmpty();
        await searchPage.assertEscapeAfterError();
    });

    test('AIO-T96: roles, matching, stale responses, timing and responsive themes @regression', async ({ searchPage }, testInfo) => {
        test.setTimeout(300000);
        await searchPage.assertKnownRecordsAndRolePermissions(testInfo.workerIndex);
        await searchPage.assertMinimumDebounceAndKeyboard();
        await searchPage.assertNewerResponseIsRetained();
        await searchPage.assertLiveTimingAndResponsiveThemes();
    });
});
