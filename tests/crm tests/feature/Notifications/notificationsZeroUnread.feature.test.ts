import { expect, test } from "@fixtures/CrmFixtures";

test('AIO-T36: Notifications panel remains available when unread count is zero @smoke @regression', async ({
    crmLoginPage,
    dashboardPage,
    notificationsPage
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();

    // Step 1: Mark all notifications read and verify the unread count reaches zero.
    await notificationsPage.assertUnreadBadgeVisible();
    await notificationsPage.toggleNotifications();
    await notificationsPage.assertPanelOpen();
    await notificationsPage.markAllRead();
    await notificationsPage.assertUnreadBadgeHidden();
    await notificationsPage.toggleNotifications();
    await notificationsPage.assertPanelClosed();

    // Step 2: Reopen the panel and verify its empty state and disabled action.
    await notificationsPage.toggleNotifications();
    await notificationsPage.assertEmptyState();
    await notificationsPage.assertMarkAllReadDisabled();

    // Step 3: Close and reopen the panel, navigate to Contacts, then return to Notifications.
    await notificationsPage.toggleNotifications();
    await notificationsPage.assertPanelClosed();
    await notificationsPage.toggleNotifications();
    await notificationsPage.assertPanelOpen();
    await notificationsPage.openNavLink('Contacts');
    await notificationsPage.assertRoute(/\/contacts(?:\/|$)/);
    await notificationsPage.assertBellVisible();
    await notificationsPage.toggleNotifications();
    await notificationsPage.assertEmptyState();
    await notificationsPage.assertMarkAllReadDisabled();
});
