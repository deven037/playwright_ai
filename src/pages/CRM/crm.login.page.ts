import { BasePage } from '../../core/BasePage';
import { Page, expect } from "@playwright/test";

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

    private get showPasswordButton() {
        return this.page.getByRole('button', { name: /show password|hide password/i });
    }

    private get forgotPassword() {
        return this.page.getByRole('button', { name: /forgot password/i })
            .or(this.page.getByRole('link', { name: /forgot password/i }));
    }

    private get alerts() {
        return this.page.getByRole('alert');
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

    // ---- AIO-102 Login redesign ----

    async setViewport(width: number, height: number) {
        await this.page.setViewportSize({ width, height });
    }

    async assertLoginFormVisible() {
        await expect(this.emailInput).toBeVisible();
        await expect(this.passwordInput).toBeVisible();
        await expect(this.loginButton).toBeVisible();
    }

    async assertNoHorizontalOverflow() {
        await expect.poll(() => this.page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
        )).toBe(true);
    }

    /** Tab from Email through every control, checking the order and that each has a visible focus. */
    async assertTabOrder() {
        const order = [
            this.emailInput,
            this.passwordInput,
            this.showPasswordButton,
            this.remeberMeCheckbox,
            this.forgotPassword,
            this.loginButton,
        ];
        await this.emailInput.focus();
        for (let i = 0; i < order.length; i++) {
            if (i > 0) {
                await this.page.keyboard.press('Tab');
            }
            await expect(order[i]).toBeFocused();
            await expect(order[i]).toBeVisible();
        }
    }

    async assertFieldLabels() {
        await expect(this.page.getByLabel('Email', { exact: false }).first()).toBeVisible();
        await expect(this.page.getByLabel('Password', { exact: true })).toBeVisible();
        await expect(this.remeberMeCheckbox).toBeVisible();
    }

    async submitEmpty() {
        await this.loginButton.click();
    }

    async assertRequiredErrors() {
        await expect(this.alerts.first()).toBeVisible();
        expect(await this.alerts.count()).toBeGreaterThanOrEqual(2);
        for (const field of [this.emailInput, this.passwordInput]) {
            await expect(field).toHaveAttribute('aria-invalid', 'true');
            await expect(field).toHaveAttribute('aria-describedby', /\S+/);
        }
    }

    async submitMalformedEmail(email: string, password: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async assertEmailValidationError() {
        await expect(this.emailInput).toHaveAttribute('aria-invalid', 'true');
        const describedBy = await this.emailInput.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
        const message = this.page.locator(`[id="${describedBy}"]`);
        await expect(message).toBeVisible();
        await expect(message).toContainText(/valid email/i);
    }

    /** Slows POST requests to the CRM API so the loading state can be observed. */
    async delayApiPosts(ms: number) {
        await this.page.route(/crm-practice-api[^/]*\.onrender\.com/, async (route) => {
            if (route.request().method() === 'POST') {
                await new Promise((resolve) => setTimeout(resolve, ms));
            }
            await route.continue();
        });
    }

    async submitCredentials(email: string, password: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    async assertBusy() {
        await expect.poll(async () =>
            (await this.loginButton.isDisabled()) || (await this.loginButton.getAttribute('aria-busy')) === 'true'
        ).toBe(true);
    }

    async assertSignInFailure() {
        await expect(this.alerts.filter({ hasText: /\S/ }).first()).toBeVisible();
        await expect(this.loginButton).toBeEnabled();
    }

    async assertCredentialsKept(email: string, password: string) {
        await expect(this.emailInput).toHaveValue(email);
        await expect(this.passwordInput).toHaveValue(password);
    }

    async toggleRememberMeByLabel() {
        const before = await this.remeberMeCheckbox.isChecked();
        await this.page.getByText('Remember me', { exact: true }).click();
        if (before) {
            await expect(this.remeberMeCheckbox).not.toBeChecked();
        } else {
            await expect(this.remeberMeCheckbox).toBeChecked();
        }
    }

    async toggleRememberMeByKeyboard() {
        const before = await this.remeberMeCheckbox.isChecked();
        await this.remeberMeCheckbox.focus();
        await this.page.keyboard.press('Space');
        if (before) {
            await expect(this.remeberMeCheckbox).not.toBeChecked();
        } else {
            await expect(this.remeberMeCheckbox).toBeChecked();
        }
    }

    async openForgotPassword() {
        await this.forgotPassword.click();
        await expect(this.page.getByRole('heading', { name: /reset password/i })).toBeVisible();
    }

    async requestReset() {
        await this.page.getByRole('button', { name: /request reset/i }).click();
        await expect(this.alerts.filter({ hasText: /\S/ }).first()).toBeVisible();
    }
}
