import { BasePage } from '@core/BasePage';
import { expect } from '@playwright/test';
import { NOTIFICATIONS_EMPTY_TEXT } from '../../data/notifications.data';

export type NavLink = 'Dashboard' | 'Leads' | 'Contacts';

export class NotificationsPage extends BasePage {
    private get bellButton() { return this.page.getByRole('button', { name: 'Notifications' }); }
    private get unreadBadge() { return this.page.locator('.bell-badge'); }
    private get panel() { return this.page.locator('.notif-panel'); }
    private get markAllReadButton() { return this.panel.getByRole('button', { name: 'Mark all read' }); }
    private get items() { return this.panel.locator('.notif-item'); }
    private get unreadItems() { return this.panel.locator('.notif-item.unread'); }
    private get avatarButton() { return this.page.getByTestId('avatar-menu'); }
    private get logOutButton() { return this.page.getByRole('button', { name: 'Log out' }); }

    async waitForPageLoad() {
        await this.helpers.waitForElement(this.bellButton);
    }

    async toggleNotifications() {
        await this.helpers.click(this.bellButton, 'Notifications');
    }

    async markAllRead() {
        await this.helpers.click(this.markAllReadButton, 'Mark all read');
    }

    async openUserMenu() {
        await this.helpers.click(this.avatarButton, 'User menu');
    }

    async pressEscape() {
        await this.helpers.pressPageKey('Escape');
    }

    async openNavLink(name: NavLink) {
        await this.helpers.click(this.page.getByRole('link', { name, exact: true }), name);
    }

    async assertRoute(route: RegExp) {
        await this.helpers.assertURL(route);
    }

    async assertBellVisible() {
        await expect(this.bellButton).toBeVisible();
    }

    async assertUnreadBadgeVisible() {
        await expect(this.unreadBadge).toBeVisible();
    }

    async assertUnreadBadgeHidden() {
        await expect(this.unreadBadge).toHaveCount(0);
    }

    async assertPanelOpen() {
        await expect(this.panel).toBeVisible();
    }

    async assertPanelClosed() {
        await expect(this.panel).toHaveCount(0);
    }

    async assertUserMenuOpen() {
        await expect(this.logOutButton).toBeVisible();
    }

    async assertUserMenuClosed() {
        await expect(this.logOutButton).toBeHidden();
    }

    async assertMarkAllReadHidden() {
        await expect(this.markAllReadButton).toBeHidden();
    }

    async assertItemCount(count: number) {
        await expect(this.items).toHaveCount(count);
    }

    async assertUnreadItemCount(count: number) {
        await expect(this.unreadItems).toHaveCount(count);
    }

    async assertMarkAllReadEnabled() {
        await expect(this.markAllReadButton).toBeEnabled();
    }

    async assertMarkAllReadDisabled() {
        await expect(this.markAllReadButton).toBeDisabled();
    }

    async assertEmptyState() {
        await expect(this.panel.getByText(NOTIFICATIONS_EMPTY_TEXT, { exact: true })).toBeVisible();
    }
}
