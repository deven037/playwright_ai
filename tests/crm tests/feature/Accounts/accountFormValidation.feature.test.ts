import { test } from "@fixtures/CrmFixtures";
import { ACCOUNT_FORM_DRAFT } from "../../../../src/data/accountForm.data";

test.describe('@feature @regression Account form', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage, accountsPage }) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForDashBoardPage();
        await accountsPage.gotoAccounts();
        await accountsPage.clickNewAccount();
        await accountsPage.chooseLayout();
    });

    test('AIO-337 rejected create shows an error, keeps the entry and re-enables the button', async ({ accountFormPage }) => {
        await accountFormPage.rejectAccountCreation();
        try {
            await accountFormPage.fillName(ACCOUNT_FORM_DRAFT.name);
            await accountFormPage.submit();
            await accountFormPage.assertCreateRequests(1);
            await accountFormPage.assertSaveErrorShown();
            await accountFormPage.assertCreateButtonReset();
            await accountFormPage.assertNameKept(ACCOUNT_FORM_DRAFT.name);
        } finally {
            await accountFormPage.stopRejectingAccountCreation();
        }
    });

    test('AIO-324 negative employees and revenue show field errors and send no request', async ({ accountFormPage }) => {
        await accountFormPage.rejectAccountCreation();
        try {
            await accountFormPage.fillName(ACCOUNT_FORM_DRAFT.negativeName);
            await accountFormPage.fillWebsite(ACCOUNT_FORM_DRAFT.website);
            await accountFormPage.fillEmployees(ACCOUNT_FORM_DRAFT.negativeEmployees);
            await accountFormPage.fillRevenue(ACCOUNT_FORM_DRAFT.negativeRevenue);
            await accountFormPage.submit();
            await accountFormPage.assertEmployeesError();
            await accountFormPage.assertRevenueError();
            await accountFormPage.assertNegativeValuesKept(ACCOUNT_FORM_DRAFT.negativeEmployees, ACCOUNT_FORM_DRAFT.negativeRevenue);
            await accountFormPage.assertCreateRequests(0);
        } finally {
            await accountFormPage.stopRejectingAccountCreation();
        }
    });

    test('AIO-324 Employees, Revenue and Phone are exposed with accessible names', async ({ accountFormPage }) => {
        await accountFormPage.assertNumericFieldsLabelled();
    });
});
