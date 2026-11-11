import { test } from "@fixtures/CrmFixtures";
import { ALL_WIDTHS, CONTACT_ID, VIEWPORT_HEIGHT } from "../../../../src/data/layout.data";

test('AIO-T160: Contact detail (shared .detail-list) is not regressed at 375/768/1440 px @regression', async ({
    crmLoginPage,
    dashboardPage,
    contactsPage
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();

    contactsPage.trackConsoleErrors();
    for (const width of ALL_WIDTHS) {
        await contactsPage.setViewport(width, VIEWPORT_HEIGHT);
        await contactsPage.openContactDetail(CONTACT_ID);
        await contactsPage.assertNoHorizontalOverflow(width);
    }
    await contactsPage.assertNoConsoleErrors();
});
