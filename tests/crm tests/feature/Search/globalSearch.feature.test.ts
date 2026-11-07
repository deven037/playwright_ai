import { test, expect } from '@fixtures/CrmFixtures';
import { searchScenarioNames } from '../../../../src/data/globalSearch.data';

// AC13 p95 is gated by message #441; controlled clocks verify debounce only.
test.describe('Global search @regression', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage }) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForDashBoardPage();
    });

    test(searchScenarioNames[0], async ({ globalSearchPage }, testInfo) => {
        test.setTimeout(180000);
        await globalSearchPage.assertKnownRecordsAndRolePermissions(testInfo.workerIndex);
    });

    test(searchScenarioNames[1], async ({ globalSearchPage }) => {
        await globalSearchPage.assertMinimumDebounceAndKeyboard();
    });

    test(searchScenarioNames[2], async ({ globalSearchPage }) => {
        await globalSearchPage.assertLoadingErrorRetryAndEmpty();
    });

    test(searchScenarioNames[3], async ({ globalSearchPage }) => {
        await globalSearchPage.assertNewerResponseIsRetained();
    });
});
