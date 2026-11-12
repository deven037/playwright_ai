import { BasePage } from '../../core/BasePage';
import { Page } from "@playwright/test";

export class CrmLoginPage extends BasePage {
    waitForPageLoad(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    constructor(page: Page) {
        super(page);
    }

    async warmUpLogin(url: string, email: string, password: string): Promise<void> {
        await this.helpers.navigateTo(url);
        await this.helpers.fill(this.emailInput, email, 'Email Input', true);
        await this.helpers.fill(this.passwordInput, password, 'Password Input', true);
        await this.helpers.click(this.loginButton, 'Login');
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

    async assertLoginFormVisible() {
        await this.helpers.assertVisible(this.emailInput, 'Login email input');
        await this.helpers.assertVisible(this.loginButton, 'Login button');
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
        await this.helpers.setChecked(this.remeberMeCheckbox, false, 'Remember me');
        await this.helpers.click(this.loginButton, 'Login');
    }

    async loginWithCustomCredentials(email: string, remember = false) {
        await this.helpers.fill(this.emailInput, email, "Email");
        await this.enterPassword();
        await this.helpers.setChecked(this.remeberMeCheckbox, remember, 'Remember me');
        await this.helpers.click(this.loginButton, 'Login');
    }

    async loginAsRole(role: 'admin' | 'rep' | 'viewer') {
        const emails = {
            admin: this.env.newAppEmail,
            rep: this.env.newAppRepEmail,
            viewer: this.env.newAppViewerEmail,
        };
        const email = emails[role]?.trim();
        if (!email) {
            const variable = role === 'admin' ? 'NEWAPP_EMAIL' : `NEWAPP_${role.toUpperCase()}_EMAIL`;
            throw new Error(`${variable} is not configured. Set it in .env or CI environment variables.`);
        }

        await this.loginWithCustomCredentials(email);
    }
}
