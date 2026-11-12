import { test } from "@fixtures/CrmFixtures";

test.describe('Leads list keyboard accessibility (AIO-61 AC3)', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage, leadsPage }) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForPageLoad();
        await dashboardPage.assertProfileIconVisible();
        await leadsPage.goToLeads();
    });

    test('@regression AIO-T22: Leads keyboard rows, Convert action and aria-sort', async ({ leadsPage }) => {
        await leadsPage.assertLeadRowsVisible();

        // Step 1: Tab until a lead row is focused, Enter opens the lead detail
        await leadsPage.assertFirstRowKeyboardReachable();
        await leadsPage.tabToLeadRow();
        await leadsPage.pressEnter();
        await leadsPage.assertLeadDetailOpen();

        // Step 2: a visible Convert button on each row, no right-click needed
        await leadsPage.goBackToLeadsList();
        await leadsPage.assertFirstRowHasVisibleConvertButton();

        // Step 3: focus Name header, Enter sorts and aria-sort is exposed
        await leadsPage.focusNameHeader();
        await leadsPage.pressEnter();
        await leadsPage.assertNameHeaderSort('ascending');
        await leadsPage.pressEnter();
        await leadsPage.assertNameHeaderSort('descending');
    });
});
