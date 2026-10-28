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

    private get activityFeed() {
        return this.page.getByLabel('Recent activity, scrollable');
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

    // ---- AIO-102 Dashboard design gaps ----

    async assertActivityFeedAccessible() {
        await expect(this.activityFeed).toBeVisible();
        await expect(this.activityFeed).toHaveAttribute('tabindex', '0');
    }

    /** Focuses the feed and scrolls it with PageDown; the scroll is asserted only when its content overflows. */
    async scrollActivityFeedWithKeyboard() {
        await this.activityFeed.focus();
        await expect(this.activityFeed).toBeFocused();
        const overflows = await this.activityFeed.evaluate((el) => el.scrollHeight > el.clientHeight);
        await this.page.keyboard.press('PageDown');
        if (overflows) {
            await expect.poll(() => this.activityFeed.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
        }
    }

    /** Reaches the "view all activity" link by keyboard focus and opens it with Enter. */
    async openViewAllActivityWithKeyboard() {
        await this.viewAllActivityLink.focus();
        await expect(this.viewAllActivityLink).toBeFocused();
        await this.page.keyboard.press('Enter');
    }

    async assertLinkedTiles() {
        const dashboard = this.page.getByTestId('dashboard-page');
        for (const path of ['/leads', '/deals', '/tasks', '/tickets']) {
            await expect(dashboard.locator(`a[href^="${path}"]`).first()).toBeVisible();
        }
    }

    async assertRangeChipVisible() {
        await expect(this.page.getByText('Last 30 days').first()).toBeVisible();
    }
}
