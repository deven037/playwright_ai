import { test } from '@fixtures/CrmFixtures';

test('AIO-T201: Escape closes the avatar menu and notifications panel @smoke @regression', async ({
    crmLoginPage,
    dashboardPage,
    notificationsPage
}) => {
    await crmLoginPage.goto();
    await dashboardPage.waitForDashBoardPage();

    // Step 1: Open the User menu, press Escape; Log out is no longer visible.
    await notificationsPage.openUserMenu();
    await notificationsPage.assertUserMenuOpen();
    await notificationsPage.pressEscape();
    await notificationsPage.assertUserMenuClosed();

    // Step 2: Open Notifications, press Escape; Mark all read is no longer visible.
    await notificationsPage.toggleNotifications();
    await notificationsPage.assertPanelOpen();
    await notificationsPage.pressEscape();
    await notificationsPage.assertPanelClosed();
    await notificationsPage.assertMarkAllReadHidden();
});
