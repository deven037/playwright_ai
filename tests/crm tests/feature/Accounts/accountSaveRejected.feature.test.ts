import { expect, test } from "@fixtures/CrmFixtures";
import { ACCOUNT_REJECT_NAME, ACCOUNT_VIEWPORT_WIDTHS } from "../../../src/data/accounts.data";

test.describe('Account create: rejected save', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage, accountsPage }) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForDashBoardPage();
        await accountsPage.openNewAccountForm();
    });

    test('AIO-T150: HTTP 500 resets button and shows error banner, entries kept @smoke @regression', async ({ accountsPage }) => {
        await accountsPage.mockCreateStatus(500);
        await accountsPage.fillAccountName(ACCOUNT_REJECT_NAME);
        expect(await accountsPage.submitAndGetCreateStatus()).toBe(500);
        await accountsPage.assertSaveRejectedState(ACCOUNT_REJECT_NAME);
    });

    test('AIO-T151: network failure and 422 also reset button and show banner @regression', async ({ accountsPage }) => {
        await accountsPage.fillAccountName(ACCOUNT_REJECT_NAME);

        await accountsPage.mockCreateAborted();
        await accountsPage.createAccount();
        await accountsPage.assertSaveRejectedState(ACCOUNT_REJECT_NAME);

        await accountsPage.mockCreateStatus(422);
        expect(await accountsPage.submitAndGetCreateStatus()).toBe(422);
        await accountsPage.assertSaveRejectedState(ACCOUNT_REJECT_NAME);
    });

    test('AIO-T152: retry succeeds after failed save; no layout overflow at 375/768/1440 @regression', async ({ accountsPage }) => {
        const accountName = `Account_${Date.now()}`;
        try {
            await accountsPage.mockCreateStatus(500);
            await accountsPage.fillAccountName(accountName);
            expect(await accountsPage.submitAndGetCreateStatus()).toBe(500);
            await accountsPage.assertSaveRejectedState(accountName);

            await accountsPage.assertNoHorizontalOverflow(ACCOUNT_VIEWPORT_WIDTHS);

            await accountsPage.removeCreateMock();
            await accountsPage.createAccount();
            expect(await accountsPage.getAccountNameFromDetailsPage()).toBe(accountName);
        } finally {
            await accountsPage.removeCreateMock();
            await accountsPage.deleteAccountIfExists(accountName);
        }
    });
});
