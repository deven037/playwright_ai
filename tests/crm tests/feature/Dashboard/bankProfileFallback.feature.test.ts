import { test, expect } from '@fixtures/CrmFixtures';

test.describe('Bank profile fallback', () => {
    test.use({ trace: 'on-first-retry' });
    test.describe.configure({ retries: 0 });

    test('AIO-T32: unavailable bank profile shows fallback and Retry loads name-only branding @regression', async ({
        crmLoginPage, dashboardPage,
    }) => {
        await dashboardPage.installUnavailableBankProfile();
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForDashBoardPage();
        await dashboardPage.assertUnavailableBankProfile();
        // Recovery supplies a bank with no logo, covering the missing-logo step
        // and proving that Retry sends a fresh bootstrap request.
        await dashboardPage.retryBankProfileWithoutLogo();
        await dashboardPage.assertBankNameWithoutLogo();
    });
});
