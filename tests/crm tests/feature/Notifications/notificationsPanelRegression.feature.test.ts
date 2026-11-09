import { expect, test } from "@fixtures/CrmFixtures";

test('AIO-T53: Notifications panel lists items while unread>0 and shows "No notifications" at zero unread, before and after navigating @smoke @regression', async ({
    crmLoginPage,
    dashboardPage,
    page
}) => {
    await crmLoginPage.goto();
    await dashboardPage.waitForDashBoardPage();

    const notificationsButton = page.getByRole('button', { name: 'Notifications' });
    const unreadBadge = page.locator('.bell-badge');
    const panel = page.locator('.notif-panel');
    const markAllReadButton = panel.getByRole('button', { name: 'Mark all read' });

    // Step 1: Open Notifications with unread items; items are listed and Mark all read is enabled.
    await expect(unreadBadge).toBeVisible();
    await notificationsButton.click();
    await expect(panel).toBeVisible();
    await expect(panel.locator('.notif-item')).toHaveCount(5);
    await expect(panel.locator('.notif-item.unread')).toHaveCount(3);
    await expect(markAllReadButton).toBeEnabled();

    // Step 2: Mark all read; badge hidden, empty state shown, action disabled.
    await markAllReadButton.click();
    await expect(unreadBadge).toHaveCount(0);
    await expect(panel.getByText('No notifications', { exact: true })).toBeVisible();
    await expect(panel.locator('.notif-item')).toHaveCount(0);
    await expect(markAllReadButton).toBeDisabled();

    // Step 3: Close the panel, navigate Leads then Dashboard in-app, reopen Notifications.
    await notificationsButton.click();
    await expect(panel).toHaveCount(0);
    await page.getByRole('link', { name: 'Leads', exact: true }).click();
    await expect(page).toHaveURL(/\/leads(?:\/|$)/);
    await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
    await dashboardPage.waitForDashBoardPage();
    await expect(notificationsButton).toBeVisible();
    await expect(unreadBadge).toHaveCount(0);
    await notificationsButton.click();
    await expect(panel.getByText('No notifications', { exact: true })).toBeVisible();
    await expect(panel.locator('.notif-item')).toHaveCount(0);
    await expect(markAllReadButton).toBeDisabled();
});
