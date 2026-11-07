import { BANK_PROFILE } from '../../data/bankProfile.data';
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

    private bootstrapRequests = 0;
    private bootstrapPayload?: Record<string, unknown>;
    private recoveryProfile = false;

    async installUnavailableBankProfile() {
        await this.page.route('**/api/bootstrap', async route => {
            if (route.request().method() !== 'GET') return route.continue();
            if (!this.bootstrapPayload) {
                const response = await route.fetch();
                expect(response.ok(), 'Bootstrap fixture must preserve a successful real payload').toBeTruthy();
                this.bootstrapPayload = await response.json();
            }
            this.bootstrapRequests++;
            await route.fulfill({ json: {
                ...this.bootstrapPayload,
                bankProfile: this.recoveryProfile ? BANK_PROFILE.withoutLogo : null,
            } });
        });
    }

    async assertUnavailableBankProfile() {
        const sidebar = this.page.getByTestId('sidebar');
        await this.helpers.assertVisible(sidebar.getByText(BANK_PROFILE.productName, { exact: true }));
        await this.helpers.assertVisible(sidebar.getByText(BANK_PROFILE.defaultMark, { exact: true }));
        const error = this.page.getByTestId('bank-profile-error');
        await this.helpers.assertVisible(error);
        await expect(error).toContainText(BANK_PROFILE.errorTitle);
        await expect(error).toContainText(BANK_PROFILE.errorDetail);
        await expect(error.getByRole('button', { name: 'Retry', exact: true })).toBeEnabled();
    }

    async retryBankProfileWithoutLogo() {
        const previousRequests = this.bootstrapRequests;
        this.recoveryProfile = true;
        await this.helpers.click(this.page.getByTestId('bank-profile-error').getByRole('button', { name: 'Retry', exact: true }));
        await expect.poll(() => this.bootstrapRequests).toBeGreaterThan(previousRequests);
    }

    async assertBankNameWithoutLogo() {
        const sidebar = this.page.getByTestId('sidebar');
        await this.helpers.assertVisible(sidebar.getByText(BANK_PROFILE.withoutLogo.name, { exact: true }));
        await expect(sidebar.getByText(BANK_PROFILE.defaultMark, { exact: true })).toHaveCount(0);
        await expect(sidebar.getByRole('img', { includeHidden: true })).toHaveCount(0);
        await expect(sidebar.getByText('Your bank', { exact: true })).toHaveCount(0);
        await expect(this.page.getByTestId('bank-profile-error')).toHaveCount(0);
    }
}
