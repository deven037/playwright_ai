import { BasePage } from '../../core/BasePage';
import { Page } from "@playwright/test";

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
}