import { BasePage } from '../../core/BasePage';
import { Page, expect } from "@playwright/test";
import {
    BOOTSTRAP_URL_PATTERN,
    PROFILE_FALLBACK_DETAIL,
    PROFILE_FALLBACK_MESSAGE
} from '../../data/bankProfile.data';

export class DashboardPage extends BasePage {

    private bootstrapRequests = 0;
    private bootstrapRequestsBeforeRetry = 0;

    async waitForPageLoad(): Promise<void> {
        await  this.page.waitForLoadState('networkidle');
    } 

    constructor(page: Page) {
        super(page);
    }

    async waitForWarmUpReady(): Promise<void> {
        await this.helpers.waitForElement(await this.profileIcon(), 'visible');
        await this.helpers.waitForElement(this.page.getByTestId('dashboard-page'), 'visible');
    }

    async profileIcon() {
        const profileIcon = this.page.locator("//button[@data-testid='avatar-menu']");
        return profileIcon;
    }

    async assertProfileIconVisible() {
        await this.helpers.assertVisible(await this.profileIcon(), 'Profile Icon is visible');
    }

    /** Opens the avatar menu and returns the signed-in "email · role" line shown under the user's name. */
    async getSignedInIdentity(): Promise<string> {
        await this.clickAvatar();
        const info = this.page.locator('.avatar-info');
        await this.helpers.waitForElement(info, 'visible');
        const lines = (await info.innerText()).split('\n').map((l) => l.trim()).filter(Boolean);
        return lines[1] ?? '';
    }

    async assertSignedInAs(identity: string) {
        expect(await this.getSignedInIdentity()).toBe(identity);
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

    private get profileFallbackMessage() {
        return this.page.getByText(PROFILE_FALLBACK_MESSAGE, { exact: true });
    }

    private get profileFallbackRetryButton() {
        return this.page.getByRole('button', { name: 'Retry', exact: true });
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

    // Bank profile fallback (AIO-154 / AIO-T32): answer /api/bootstrap with 200 and bankProfile:null,
    // count the requests, then reload so the shell asks again under the stub.
    async failBootstrapProfile() {
        this.bootstrapRequests = 0;
        await this.page.route(BOOTSTRAP_URL_PATTERN, async route => {
            this.bootstrapRequests++;
            const response = await route.fetch();
            const body = await response.json();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ ...body, bankProfile: null })
            });
        });
        await this.page.reload();
    }

    async assertProfileFallbackMessage() {
        await expect(this.profileFallbackMessage).toBeVisible();
        await expect(this.page.getByText(PROFILE_FALLBACK_DETAIL, { exact: true })).toBeVisible();
        await expect(this.profileFallbackRetryButton).toBeVisible();
    }

    async clickRetry() {
        await this.profileFallbackRetryButton.click();
    }

    // The shell may ask for the profile more than once on load, so Retry is checked against the count seen once the fallback shows.
    async rememberBootstrapRequestCount() {
        await this.page.waitForLoadState('networkidle');
        this.bootstrapRequestsBeforeRetry = this.bootstrapRequests;
    }

    async assertRetrySentNewRequest() {
        await expect.poll(() => this.bootstrapRequests).toBe(this.bootstrapRequestsBeforeRetry + 1);
    }

    // Removes the stub and waits for in-flight handlers, so none calls route.fetch after the test's request context is disposed.
    async stopBootstrapStub() {
        await this.page.unrouteAll({ behavior: 'wait' });
    }
}
