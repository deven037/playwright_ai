import { BasePage } from "@core/BasePage";
import { Page } from "@playwright/test";

export class CrmLoginPage extends BasePage {
    waitForPageLoad(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    constructor(page: Page) {
        super(page);
    }

    async goto() {
        await this.page.goto(process.env.NEWAPP_BASE_URL || '');
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
        return this.page.locator("//label[@class='checkbox-label']/input");
    }

    async enterEmail(){
        this.logger.info('Entering email');
        await this.helpers.fill(this.emailInput, process.env.NEWAPP_EMAIL || '', 'Email Input');
    }

    async enterPassword(){
        this.logger.info('Entering password');
        await this.helpers.fill(this.passwordInput, process.env.NEWAPP_PASSWORD || '', 'Password Input');
    }

    async loginWithDefaultCredentials() {
        const email = process.env.NEWAPP_EMAIL || '';
        const password = process.env.NEWAPP_PASSWORD || '';
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.remeberMeCheckbox.uncheck();
        await this.loginButton.click();
    }
}