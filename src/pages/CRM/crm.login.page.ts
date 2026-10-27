import { BasePage } from '../../core/BasePage';
import { Page } from "@playwright/test";

export class CrmLoginPage extends BasePage {
    waitForPageLoad(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    constructor(page: Page) {
        super(page);
    }

    async goto() {
        const crmUrl = this.env.newAppBaseUrl?.trim();
        if (!crmUrl) {
            throw new Error('NEWAPP_BASE_URL is not configured. Set it in .env or CI environment variables.');
        }

        await this.page.goto(crmUrl);
        await this.page.waitForLoadState('networkidle');
    }

    private get emailInput() {
        return this.page.locator("//input[@data-testid='login-email']");
    }

    private get passwordInput() {
        return this.page.locator("//input[@data-testid='login-password']");
    }

    private get loginButton() {
        return this.page.locator("//button[@data-testid='login-submit']");
    }

    private get remeberMeCheckbox() {
        return this.page.getByRole('checkbox', { name: 'Remember me' });
    }

    async enterEmail(){
        const email = this.env.newAppEmail?.trim();
        if (!email) {
            throw new Error('NEWAPP_EMAIL is not configured. Set it in .env or CI environment variables.');
        }

        this.logger.info('Entering email');
        await this.helpers.fill(this.emailInput, email, 'Email Input');
    }

    async enterPassword(){
        const password = this.env.newAppPassword?.trim();
        if (!password) {
            throw new Error('NEWAPP_PASSWORD is not configured. Set it in .env or CI environment variables.');
        }

        this.logger.info('Entering password');
        await this.helpers.fill(this.passwordInput, password, 'Password Input');
    }

    async loginWithDefaultCredentials() {
        await this.enterEmail();
        await this.enterPassword();
        await this.remeberMeCheckbox.uncheck();
        await this.loginButton.click();
    }

    async loginWithCustomCredentials(email: string) {
        await this.helpers.fill(this.emailInput, email, "Email");
        await this.enterPassword();
        await this.remeberMeCheckbox.uncheck();
        await this.loginButton.click();
    }
}
