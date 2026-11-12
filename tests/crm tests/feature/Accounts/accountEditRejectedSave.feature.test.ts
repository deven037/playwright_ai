import { test } from "@fixtures/CrmFixtures";
import { DRAFT_ACCOUNT_NAME, EDITED_PHONE, SERVER_ERROR_BODY } from "../../../../src/data/accounts.data";

test('AIO-T149: Account edit: rejected save (HTTP 500) shows an error and keeps the edit form @smoke @regression', async ({
    crmLoginPage,
    dashboardPage,
    accountsPage
}) => {
    await crmLoginPage.goto();
    await dashboardPage.waitForDashBoardPage();

    try {
        // Step 1: open the account and start editing
        await accountsPage.openSeededAccountForEdit();
        await accountsPage.assertEditFormWithSaveEnabled();

        // Step 2: rejected save shows the alert banner
        await accountsPage.rejectAccountSaves();
        await accountsPage.editPhone(EDITED_PHONE);
        await accountsPage.clickSave();
        await accountsPage.assertSaveErrorShown();
        await accountsPage.assertRejectedSaveRequests(1);

        // Step 3: still in edit mode with the entries kept and Save enabled
        await accountsPage.assertEditFormKept(EDITED_PHONE);

        // Step 4: second save shows the banner again
        await accountsPage.clickSave();
        await accountsPage.assertRejectedSaveRequests(2);
        await accountsPage.assertSaveErrorShown();
        await accountsPage.assertEditFormKept(EDITED_PHONE);
    } finally {
        await accountsPage.stopRejectingAccountSaves();
    }
});

test('AIO-T200: Rejected account create and inline save retain draft and recover controls @smoke @regression', async ({
    crmLoginPage,
    dashboardPage,
    accountsPage
}) => {
    await crmLoginPage.goto();
    await dashboardPage.waitForDashBoardPage();

    try {
        // Step 1: create form, POST /api/accounts -> 500; draft kept, banner shown, Create account enabled
        await accountsPage.openNewAccountForm();
        await accountsPage.rejectAccountCreates(500, SERVER_ERROR_BODY);
        await accountsPage.fillAccountName(DRAFT_ACCOUNT_NAME);
        await accountsPage.createAccount();
        await accountsPage.assertRejectedCreateRequests(1);
        await accountsPage.assertCreateFailedAndFormReset(DRAFT_ACCOUNT_NAME);

        // Step 2: inline edit of account-5, PUT -> 500; draft kept, banner shown, Save enabled
        await accountsPage.openSeededAccountForEdit();
        await accountsPage.assertEditFormWithSaveEnabled();
        await accountsPage.rejectAccountSaves();
        await accountsPage.editPhone(EDITED_PHONE);
        await accountsPage.clickSave();
        await accountsPage.assertRejectedSaveRequests(1);
        await accountsPage.assertSaveErrorShown();
        await accountsPage.assertEditFormKept(EDITED_PHONE);
    } finally {
        await accountsPage.stopInterceptingAccountCreates();
        await accountsPage.stopRejectingAccountSaves();
    }
});
