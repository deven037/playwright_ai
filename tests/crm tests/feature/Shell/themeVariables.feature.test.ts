import { test } from "@fixtures/CrmFixtures";
import { VIEWPORT_WIDTHS } from "../../../../src/data/theme.data";

test('AIO-T155: Design tokens are defined once as CSS custom properties on :root @feature @regression', async ({
    crmLoginPage,
    themePage
}) => {
    // Step 1: login page renders
    await crmLoginPage.goto();

    // Step 2: the required tokens exist, each declared once
    await themePage.assertTokensDefinedOnce();

    // Step 3: body font-family resolves to the --font-sans stack
    await themePage.assertBodyUsesSansStack();
});

test('AIO-T156: Login, Dashboard and Leads render without layout break or console errors at 375/768/1440 @feature @regression', async ({
    crmLoginPage,
    dashboardPage,
    themePage
}) => {
    themePage.startCollectingConsoleErrors();

    // Step 1: login page at each width
    for (const width of VIEWPORT_WIDTHS) {
        await themePage.setWidth(width);
        await crmLoginPage.goto();
        await themePage.assertNoHorizontalOverflow();
    }

    // Step 2: sign in; dashboard at each width
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();
    for (const width of VIEWPORT_WIDTHS) {
        await themePage.setWidth(width);
        await themePage.assertNoHorizontalOverflow();
    }

    // Step 3: leads at each width
    await themePage.openLeadsPage();
    for (const width of VIEWPORT_WIDTHS) {
        await themePage.setWidth(width);
        await themePage.assertLeadsListed();
        await themePage.assertNoHorizontalOverflow();
    }

    themePage.assertNoConsoleErrors();
});
