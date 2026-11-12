import { expect, test } from "@fixtures/CrmFixtures";
import { INVALID_CREATE_BODY, REJECTED_CREATE_BODY, REJECTED_CREATE_NAME } from "../../../../src/data/accounts.data";

test.describe('AIO-337: account create form after a rejected save', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage, accountsPage }) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForDashBoardPage();
        await accountsPage.openNewAccountForm();
    });

    test('AIO-T150: Account create: HTTP 500 resets button and shows error banner, entries kept @smoke @regression', async ({ accountsPage }) => {
        try {
            await accountsPage.rejectAccountCreates(500, REJECTED_CREATE_BODY);
            await accountsPage.fillAccountName(REJECTED_CREATE_NAME);
            await accountsPage.createAccount();
            await accountsPage.assertRejectedCreateRequests(1);
            await accountsPage.assertCreateFailedAndFormReset(REJECTED_CREATE_NAME);
        } finally {
            await accountsPage.stopInterceptingAccountCreates();
        }
    });

    test('AIO-T151: Account create: network failure and 422 also reset button and show banner @regression', async ({ accountsPage }) => {
        try {
            await accountsPage.abortAccountCreates();
            await accountsPage.fillAccountName(REJECTED_CREATE_NAME);
            await accountsPage.createAccount();
            await accountsPage.assertRejectedCreateRequests(1);
            await accountsPage.assertCreateFailedAndFormReset(REJECTED_CREATE_NAME);

            // Installing the 422 stub resets the request count for this attempt.
            await accountsPage.rejectAccountCreates(422, INVALID_CREATE_BODY);
            await accountsPage.createAccount();
            await accountsPage.assertRejectedCreateRequests(1);
            await accountsPage.assertCreateFailedAndFormReset(REJECTED_CREATE_NAME);
        } finally {
            await accountsPage.stopInterceptingAccountCreates();
        }
    });

    test('AIO-T152: Account create: retry succeeds after failed save; no layout overflow at 375/768/1440 @regression', async ({ accountsPage }) => {
        let accountName: string | undefined;
        try {
            await accountsPage.rejectAccountCreates(500, REJECTED_CREATE_BODY);
            accountName = await accountsPage.fillGeneratedAccountName();
            await accountsPage.createAccount();
            await accountsPage.assertRejectedCreateRequests(1);
            await accountsPage.assertCreateFailedAndFormReset(accountName);

            await accountsPage.assertNoHorizontalOverflowAtFormViewports();

            await accountsPage.stopInterceptingAccountCreates();
            await accountsPage.createAccount();
            await accountsPage.assertAccountDetailShown(accountName);
        } finally {
            await accountsPage.stopInterceptingAccountCreates();
            if (accountName) {
                await accountsPage.deleteAccountIfExists(accountName);
            }
        }
    });
});

test('AIO-T164: @feature @smoke @regression Verify Account Creation and Deletion', async ({
    crmLoginPage,
    dashboardPage,
    accountsPage
}) => {
    let createdName: string | undefined;

    try {
        await crmLoginPage.goto();
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
