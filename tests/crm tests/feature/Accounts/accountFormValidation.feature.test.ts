import { expect, test } from "@fixtures/CrmFixtures";
import {
    ACCOUNT_FORM_VIEWPORTS,
    NEGATIVE_EMPLOYEES_MESSAGE,
    NEGATIVE_REVENUE_MESSAGE,
} from "../../../../src/data/accounts.data";

test.beforeEach(async ({ crmLoginPage, dashboardPage, accountsPage }) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();
    await accountsPage.openNewAccountForm();
});

test('@feature @regression AIO-T153: New account: negative Employees and Revenue show field errors and block save', async ({
    accountsPage
}) => {
    let createdName: string | undefined;

    try {
        const name = await accountsPage.fillNameEmployeesRevenue('-5', '-100');
        await accountsPage.createAccount();

        await accountsPage.assertStillOnNewAccountForm();
        await accountsPage.assertFieldError('employees', NEGATIVE_EMPLOYEES_MESSAGE);
        await accountsPage.assertFieldError('revenue', NEGATIVE_REVENUE_MESSAGE);
        await accountsPage.assertFieldValue('employees', '-5');
        await accountsPage.assertFieldValue('revenue', '-100');

        await accountsPage.setRevenue('1000');
        await accountsPage.createAccount();
        await accountsPage.assertStillOnNewAccountForm();
        await accountsPage.assertFieldError('employees', NEGATIVE_EMPLOYEES_MESSAGE);
        await accountsPage.assertNoFieldError('revenue');

        await accountsPage.setEmployees('0');
        await accountsPage.setRevenue('0');
        createdName = name;
        await accountsPage.createAccount();

        const accountName = await accountsPage.getAccountNameFromDetailsPage();
        expect(accountName).toBe(name);
    } finally {
        if (createdName) {
            await accountsPage.deleteAccountIfExists(createdName);
        }
    }
});

test('@feature @regression AIO-T154: New account: all 7 labels are tied to their inputs (htmlFor)', async ({
    accountsPage
}) => {
    await accountsPage.assertLabelsFocusTheirControls();
    await accountsPage.assertControlAccessibleNames();

    await accountsPage.setEmployees('-5');
    await accountsPage.createAccount();
    await accountsPage.assertErrorsVisibleWithoutOverflow(ACCOUNT_FORM_VIEWPORTS);
});
