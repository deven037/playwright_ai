import { test } from "@fixtures/CrmFixtures";

test('AIO-T202: Bank profile load failure shows default Harbor name, message and Retry @feature @regression', async ({
    crmLoginPage,
    dashboardPage
}) => {
    await crmLoginPage.goto();
    await dashboardPage.waitForDashBoardPage();

    // Precondition: GET /api/bootstrap fails with HTTP 500
    await dashboardPage.failBootstrapRequests();

    // Step 1: loading /leads keeps the user there, with the default Harbor shell, message and Retry
    await dashboardPage.openLeadsPage();
    await dashboardPage.assertStillOnLeads();
    await dashboardPage.assertDefaultShellWithFallback();
    await dashboardPage.rememberBootstrapRequestCount();

    // Step 2: once bootstrap succeeds, Retry sends a new request and the message goes away
    await dashboardPage.allowBootstrapRequests();
    await dashboardPage.clickRetry();
    await dashboardPage.assertRetrySentNewRequest();
    await dashboardPage.assertProfileFallbackGone();
    await dashboardPage.stopBootstrapStub();
});
