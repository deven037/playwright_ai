import { test } from "@fixtures/CrmFixtures";
import {
    INDUSTRY_SEARCH_ACCOUNTS,
    INDUSTRY_SEARCH_PADDED,
    NAME_SEARCH_ACCOUNTS,
    NAME_SEARCH_UPPERCASE,
} from "../../../../src/data/accounts.data";

test.describe('Accounts search matches name and industry (AIO-323 / AIO-148 AC2)', () => {
    test.use({ role: 'viewer' });

    test('AIO-T162: Accounts search matches name and industry, case-insensitive and trimmed @regression', async ({ crmLoginPage, dashboardPage, accountsPage }) => {
        await crmLoginPage.goto();
        await dashboardPage.waitForPageLoad();
        await accountsPage.gotoAccounts();

        // Step 1: padded industry text lists the Finance accounts only
        await accountsPage.searchInAccountsTable(INDUSTRY_SEARCH_PADDED);
        await accountsPage.assertListedAccounts(INDUSTRY_SEARCH_ACCOUNTS);

        // Step 2: upper-case name text lists the matching account only
        await accountsPage.searchInAccountsTable(NAME_SEARCH_UPPERCASE);
        await accountsPage.assertListedAccounts(NAME_SEARCH_ACCOUNTS);
    });
});
