import { expect, test } from "@fixtures/CrmFixtures";

test('@feature @smoke @regression Verify Account Creation and Deletion', async ({
    crmLoginPage,
    dashboardPage,
    accountsPage
}) => {
    let createdName: string | undefined;

    try {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForDashBoardPage();
        await dashboardPage.assertProfileIconVisible();

        await accountsPage.gotoAccounts();
        await accountsPage.clickNewAccount();
        await accountsPage.chooseLayout();
        const expectedName = await accountsPage.fillAccountDetails('120', '5551234567');
        createdName = expectedName;
        await accountsPage.createAccount();

        const accountName = await accountsPage.getAccountNameFromDetailsPage();
        expect(accountName).toBe(expectedName);

        await accountsPage.gotoAccounts();
        await accountsPage.searchInAccountsTable(accountName);
        await accountsPage.assertAccountListed(accountName);

        await accountsPage.openAccount(accountName);
        await accountsPage.deleteAccount();
        await accountsPage.confirmDelete();

        await accountsPage.searchInAccountsTable(accountName);
        await accountsPage.assertAccountNotListed(accountName);
        await accountsPage.assertNoRecordFoundMessage();
    } finally {
        if (createdName) {
            await accountsPage.deleteAccountIfExists(createdName);
        }
    }
})
