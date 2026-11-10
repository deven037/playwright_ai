import { test } from "@fixtures/CrmFixtures";
import { INDUSTRY_SEARCH, SEEDED_ACCOUNT_COUNT } from '../../../../src/data/accounts.data';

test('AIO-T143: Accounts search matches industry, case-insensitive @feature @regression', async ({
    crmLoginPage,
    dashboardPage,
    accountsPage
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();

    // Step 1: seeded list
    await accountsPage.gotoAccounts();
    await accountsPage.assertAccountsCount(SEEDED_ACCOUNT_COUNT);

    // Step 2: industry query in a different case than the data
    await accountsPage.searchInAccountsTable(INDUSTRY_SEARCH.query);
    await accountsPage.assertAccountsCount(INDUSTRY_SEARCH.accounts.length);
    for (const name of INDUSTRY_SEARCH.accounts) {
        await accountsPage.assertAccountListed(name);
    }

    // Step 3: clearing restores the full list
    await accountsPage.clearAccountsSearch();
    await accountsPage.assertAccountsCount(SEEDED_ACCOUNT_COUNT);
});
