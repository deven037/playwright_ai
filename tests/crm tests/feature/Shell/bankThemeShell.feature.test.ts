import { test } from "@fixtures/CrmFixtures";
import { BANK_THEME_PATHS, BANK_THEME_ROLES } from "../../../../src/data/theme.data";

// AIO-404: starts signed out, because Login is part of the check and each role signs in through the form.
test.use({ role: 'anonymous' });

test('AIO-T210: Bank theme colour and name apply on Login and after login on every page, and after reload @feature @regression', async ({
    crmLoginPage,
    dashboardPage,
    themePage
}) => {
    for (const { email } of BANK_THEME_ROLES) {
        // Step 1: Login shows the bank colour and name
        await crmLoginPage.goto();
        await themePage.assertLoginUsesBankTheme();

        // Step 2: after sign in, every shell page uses the same colour and name
        await crmLoginPage.loginWithCustomCredentials(email);
        await dashboardPage.waitForDashBoardPage();
        for (const path of BANK_THEME_PATHS) {
            await themePage.openPage(path);
            await themePage.assertShellUsesBankTheme();

            // Step 3: the reload keeps the colour and name, with no fall back to the default brand
            await themePage.reloadPage();
            await themePage.assertShellUsesBankTheme();
        }

        // Next role starts from the login form
        await themePage.clearSession();
    }
});
