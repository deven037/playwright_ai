import { test } from "@fixtures/CrmFixtures";
import { EXPECTED_BOOTSTRAP_REQUESTS_AFTER_RETRY } from "../../../../src/data/bankProfile.data";

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
    await dashboardPage.assertBootstrapRequestCount(1);

    // Step 3: Retry sends a second bootstrap request
    await dashboardPage.clickRetry();
    await dashboardPage.assertBootstrapRequestCount(EXPECTED_BOOTSTRAP_REQUESTS_AFTER_RETRY);
});
