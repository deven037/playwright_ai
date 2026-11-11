import { expect, test } from "@fixtures/CrmFixtures";

test('AIO-T36: Notifications panel remains available when unread count is zero @smoke @regression', async ({
    crmLoginPage,
    dashboardPage,
    page
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();

    const notificationsButton = page.getByRole('button', { name: 'Notifications' });
    const unreadBadge = page.locator('.bell-badge');

    // Step 1: Mark all notifications read and verify the unread count reaches zero.
    await expect(unreadBadge).toBeVisible();
    await notificationsButton.click();
    const panel = page.locator('.notif-panel');
    await expect(panel).toBeVisible();
    const markAllReadButton = panel.getByRole('button', { name: 'Mark all read' });
    await markAllReadButton.click();
    await expect(unreadBadge).toHaveCount(0);
    await notificationsButton.click();
    await expect(panel).toHaveCount(0);

    // Step 2: Reopen the panel and verify its empty state and disabled action.
    await notificationsButton.click();
    await expect(panel.getByText('No notifications', { exact: true })).toBeVisible();
    await expect(markAllReadButton).toBeDisabled();

    // Step 3: Close and reopen the panel, navigate to Contacts, then return to Notifications.
    await notificationsButton.click();
    await expect(panel).toHaveCount(0);
    await notificationsButton.click();
    await expect(panel).toBeVisible();
    await page.getByRole('link', { name: 'Contacts', exact: true }).click();
    await expect(page).toHaveURL(/\/contacts(?:\/|$)/);
    await expect(notificationsButton).toBeVisible();
    await notificationsButton.click();
    await expect(panel.getByText('No notifications', { exact: true })).toBeVisible();
    await expect(markAllReadButton).toBeDisabled();
});
