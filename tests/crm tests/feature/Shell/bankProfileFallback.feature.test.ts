import { test } from "@fixtures/CrmFixtures";

test('AIO-T32: Bank profile unavailable shows fallback message and Retry sends a new request @feature @regression', async ({
    crmLoginPage,
    dashboardPage
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();

    // Step 1: /api/bootstrap answers 200 with bankProfile:null
    await dashboardPage.failBootstrapProfile();

    // Step 2: shell shows the plain-language message and a Retry control
    await dashboardPage.assertProfileFallbackMessage();
    await dashboardPage.rememberBootstrapRequestCount();

    // Step 3: Retry sends one new bootstrap request
    await dashboardPage.clickRetry();
    await dashboardPage.assertRetrySentNewRequest();
    await dashboardPage.stopBootstrapStub();
});
