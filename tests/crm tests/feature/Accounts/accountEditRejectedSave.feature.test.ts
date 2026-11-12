import { test } from "@fixtures/CrmFixtures";
import { EDITED_PHONE } from "../../../../src/data/accounts.data";

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
