import { test, expect } from '@fixtures/CrmFixtures';
import { searchScenarioNames } from '../../../../src/data/search.data';

// AC13 p95 is gated by message #441; controlled clocks verify debounce only.
test.describe('Global search @regression', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage }) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForDashBoardPage();
    });

    test(searchScenarioNames[0], async ({ searchPage }, testInfo) => {
        test.setTimeout(180000);
        await searchPage.assertKnownRecordsAndRolePermissions(testInfo.workerIndex);
    });

    test(searchScenarioNames[1], async ({ searchPage }) => {
        await searchPage.assertMinimumDebounceAndKeyboard();
    });

    test(searchScenarioNames[2], async ({ searchPage }) => {
        await searchPage.assertLoadingErrorRetryAndEmpty();
    });

    test(searchScenarioNames[3], async ({ searchPage }) => {
        await searchPage.assertNewerResponseIsRetained();
    });
});
