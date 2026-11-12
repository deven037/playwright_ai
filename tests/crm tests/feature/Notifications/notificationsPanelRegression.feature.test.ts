import { expect, test } from "@fixtures/CrmFixtures";
import { NOTIFICATIONS_SEEDED_ITEM_COUNT, NOTIFICATIONS_SEEDED_UNREAD_COUNT } from '../../../../src/data/notifications.data';

test('AIO-T53: Notifications panel lists items while unread>0 and shows "No notifications" at zero unread, before and after navigating @smoke @regression', async ({
    crmLoginPage,
    dashboardPage,
    notificationsPage
}) => {
    await crmLoginPage.goto();
    await dashboardPage.waitForDashBoardPage();

    // Step 1: Open Notifications with unread items; items are listed and Mark all read is enabled.
    await notificationsPage.assertUnreadBadgeVisible();
    await notificationsPage.toggleNotifications();
    await notificationsPage.assertPanelOpen();
    await notificationsPage.assertItemCount(NOTIFICATIONS_SEEDED_ITEM_COUNT);
    await notificationsPage.assertUnreadItemCount(NOTIFICATIONS_SEEDED_UNREAD_COUNT);
    await notificationsPage.assertMarkAllReadEnabled();

    // Step 2: Mark all read; badge hidden, empty state shown, action disabled.
    await notificationsPage.markAllRead();
    await notificationsPage.assertUnreadBadgeHidden();
    await notificationsPage.assertEmptyState();
    await notificationsPage.assertItemCount(0);
    await notificationsPage.assertMarkAllReadDisabled();

    // Step 3: Close the panel, navigate Leads then Dashboard in-app, reopen Notifications.
    await notificationsPage.toggleNotifications();
    await notificationsPage.assertPanelClosed();
    await notificationsPage.openNavLink('Leads');
    await notificationsPage.assertRoute(/\/leads(?:\/|$)/);
    await notificationsPage.openNavLink('Dashboard');
    await dashboardPage.waitForDashBoardPage();
    await notificationsPage.assertBellVisible();
    await notificationsPage.assertUnreadBadgeHidden();
    await notificationsPage.toggleNotifications();
    await notificationsPage.assertEmptyState();
    await notificationsPage.assertItemCount(0);
    await notificationsPage.assertMarkAllReadDisabled();
});
