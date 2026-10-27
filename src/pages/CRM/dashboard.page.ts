import { BasePage } from '../../core/BasePage';
import { Page, expect } from "@playwright/test";

export class DashboardPage extends BasePage {

    async waitForPageLoad(): Promise<void> {
        await  this.page.waitForLoadState('networkidle');
    } 

    constructor(page: Page) {
        super(page);
    }

    async profileIcon() {
        const profileIcon = this.page.locator("//button[@data-testid='avatar-menu']");
        return profileIcon;
    }

    async assertProfileIconVisible() {
        await this.helpers.assertVisible(await this.profileIcon(), 'Profile Icon is visible');
    }

    async clickAvatar() {
        const profileIcon = this.page.locator("//button[@data-testid='avatar-menu']");
        await this.helpers.click(profileIcon, 'Profile');
    }

    async waitForDashBoardPage() {
        await this.waitForPageLoad();
        const dashboardPage = this.page.locator("//div[@data-testid='dashboard-page']");
        await this.helpers.waitForElement(dashboardPage, 'visible');
    }

    private get viewAllActivityLink() {
        return this.page.getByTestId('activity-view-all');
    }

    private get backToDashboardLink() {
        return this.page.getByRole('link', { name: 'Back to Dashboard' });
    }

    async assertViewAllActivityIsLink() {
        await expect(this.viewAllActivityLink).toBeVisible();
        await expect(this.page.getByRole('link', { name: /view all activity/i })).toHaveAttribute('href', '/activity');
    }

    async openViewAllActivity() {
        await this.viewAllActivityLink.click();
    }

    async assertActivityViewOpen() {
        await expect(this.page).toHaveURL(/\/activity$/);
        await expect(this.backToDashboardLink).toBeVisible();
    }

    async clickBackToDashboard() {
        await this.backToDashboardLink.click();
    }

    async assertDashboardUrl() {
        await expect(this.page).toHaveURL(/\/dashboard$/);
    }
}
