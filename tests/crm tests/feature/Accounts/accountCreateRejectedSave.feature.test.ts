import { expect, test } from "@fixtures/CrmFixtures";
import {
    CREATE_REJECT_NAME,
    CREATE_RETRY_NAME_PREFIX,
    CREATE_VIEWPORT_WIDTHS
} from "../../../../src/data/accounts.data";

test.describe('AIO-337: account create form after a rejected save', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage, accountsPage }) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForDashBoardPage();
        await accountsPage.openNewAccountForm();
    });

    test('AIO-T150: Account create: HTTP 500 resets button and shows error banner, entries kept @smoke @regression', async ({
        accountsPage
    }) => {
        try {
            // Step 1: submit with POST /api/accounts returning 500
            await accountsPage.failAccountCreates('http500');
            await accountsPage.enterAccountName(CREATE_REJECT_NAME);
            await accountsPage.createAccount();
            await accountsPage.assertRejectedCreateRequests(1);

            // Step 2: banner, enabled button, kept name, same URL
            await accountsPage.assertCreateRejectedAndFormKept(CREATE_REJECT_NAME);
        } finally {
            await accountsPage.stopFailingAccountCreates();
        }
    });

    test('AIO-T151: Account create: network failure and 422 also reset button and show banner @regression', async ({
        accountsPage
    }) => {
        try {
            // Step 1: aborted request
            await accountsPage.failAccountCreates('abort');
            await accountsPage.enterAccountName(CREATE_REJECT_NAME);
            await accountsPage.createAccount();
            await accountsPage.assertRejectedCreateRequests(1);
            await accountsPage.assertCreateRejectedAndFormKept(CREATE_REJECT_NAME);

            // Step 2: 422 response
            await accountsPage.switchCreateFailure('http422');
            await accountsPage.createAccount();
            await accountsPage.assertRejectedCreateRequests(1);
            await accountsPage.assertCreateRejectedAndFormKept(CREATE_REJECT_NAME);
        } finally {
            await accountsPage.stopFailingAccountCreates();
        }
    });

    test('AIO-T152: Account create: retry succeeds after failed save; no layout overflow at 375/768/1440 @regression', async ({
        accountsPage
    }) => {
        const retryName = `${CREATE_RETRY_NAME_PREFIX}${Date.now()}`;
        try {
            await accountsPage.failAccountCreates('http500');
            await accountsPage.enterAccountName(retryName);
            await accountsPage.createAccount();
            await accountsPage.assertCreateRejectedAndFormKept(retryName);

            // Step 1: no horizontal overflow at each width
            for (const width of CREATE_VIEWPORT_WIDTHS) {
                await accountsPage.setViewportWidth(width);
                await accountsPage.assertNoHorizontalOverflow();
            }

            // Step 2: remove the mock and retry; lands on the detail page
            await accountsPage.stopFailingAccountCreates();
            await accountsPage.createAccount();
            const createdName = await accountsPage.getAccountNameFromDetailsPage();
            expect(createdName).toBe(retryName);
        } finally {
            await accountsPage.stopFailingAccountCreates();
            await accountsPage.deleteAccountIfExists(retryName);
        }
    });
});
