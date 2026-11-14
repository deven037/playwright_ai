import { BasePage } from '../../core/BasePage';
import { Page, expect } from '@playwright/test';
import { BANK_NAME, REQUIRED_TOKENS, TOKEN_PREFIXES, VIEWPORT_HEIGHT } from '../../data/theme.data';

// Harbor theme variables (AIO-134 / AIO-T155, AIO-T156) and the bank theme in the shell (AIO-404 / AIO-T210).
export class ThemePage extends BasePage {

    private consoleErrors: string[] = [];

    async waitForPageLoad(): Promise<void> {
        await this.page.waitForLoadState('networkidle');
    }

    constructor(page: Page) {
        super(page);
    }

    private get leadRows() {
        return this.page.locator('tr.row-clickable');
    }

    private get loginSubmitButton() {
        return this.page.getByTestId('login-submit');
    }

    private get shellBrandName() {
        return this.page.locator('.brand-name');
    }

    private get activeNavLink() {
        return this.page.locator('.nav-link.active');
    }

    private get avatarCircle() {
        return this.page.getByTestId('avatar-menu').locator('.avatar-circle');
    }

    private get primaryCreateButtons() {
        return this.page.locator('.btn-create, .contacts-primary');
    }

    // Names of every custom property declared in a :root rule, one entry per declaration across all :root rules.
    private async rootTokenDeclarations(): Promise<string[]> {
        return this.page.evaluate(() => {
            const names: string[] = [];
            for (const sheet of Array.from(document.styleSheets)) {
                let rules: CSSRuleList;
                try { rules = sheet.cssRules; } catch { continue; }
                for (const rule of Array.from(rules)) {
                    if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
                        for (const name of Array.from(rule.style)) {
                            if (name.startsWith('--')) names.push(name);
                        }
                    }
                }
            }
            return names;
        });
    }

    async assertTokensDefinedOnce() {
        const declared = await this.rootTokenDeclarations();
        for (const token of REQUIRED_TOKENS) {
            expect(declared, `${token} is defined on :root`).toContain(token);
        }
        for (const prefix of TOKEN_PREFIXES) {
            expect(declared.some(name => name.startsWith(prefix)), `a ${prefix}* token is defined`).toBe(true);
        }
        const duplicates = declared.filter((name, index) => declared.indexOf(name) !== index);
        expect(duplicates, 'custom property names declared more than once on :root').toEqual([]);
    }

    async assertBodyUsesSansStack() {
        const fonts = await this.page.evaluate(() => ({
            body: getComputedStyle(document.body).fontFamily,
            sans: getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim()
        }));
        expect(fonts.sans).not.toBe('');
        expect(fonts.body).toBe(fonts.sans);
    }

    // Console errors are collected from here on, so the three widths of a test share one list.
    startCollectingConsoleErrors() {
        this.consoleErrors = [];
        this.page.on('console', message => {
            if (message.type() === 'error') this.consoleErrors.push(message.text());
        });
        this.page.on('pageerror', error => this.consoleErrors.push(error.message));
    }

    assertNoConsoleErrors() {
        expect(this.consoleErrors, 'console errors').toEqual([]);
    }

    async setWidth(width: number) {
        await this.page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
    }

    async assertNoHorizontalOverflow() {
        await expect.poll(() => this.page.evaluate(() =>
            document.documentElement.scrollWidth - document.documentElement.clientWidth
        )).toBeLessThanOrEqual(0);
    }

    async openLeadsPage() {
        await this.openPage('/leads');
    }

    async assertLeadsListed() {
        await expect(this.leadRows.first()).toBeVisible();
    }

    async openPage(path: string) {
        const baseUrl = this.env.newAppBaseUrl?.trim();
        if (!baseUrl) {
            throw new Error('NEWAPP_BASE_URL is not configured. Set it in .env or CI environment variables.');
        }
        await this.page.goto(`${baseUrl.replace(/\/+$/, '')}${path}`);
    }

    async reloadPage() {
        await this.helpers.refreshPage();
    }

    // Drops the signed-in session so the next role starts from the login form.
    async clearSession() {
        await this.page.context().clearCookies();
        await this.page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    }

    // --- Bank theme (AIO-404 / AIO-T210) ---------------------------------------

    // --bank-primary resolved to the rgb() string the browser computes for it.
    private async bankPrimaryColour(): Promise<string> {
        return this.page.evaluate(() => {
            const probe = document.createElement('span');
            probe.style.color = 'var(--bank-primary)';
            document.body.appendChild(probe);
            const colour = getComputedStyle(probe).color;
            probe.remove();
            return colour;
        });
    }

    private backgroundOf(locator: ReturnType<Page['locator']>) {
        return locator.evaluate(element => getComputedStyle(element).backgroundColor);
    }

    // Login: the Sign in button uses --bank-primary and the bank name is shown.
    async assertLoginUsesBankTheme() {
        await expect(this.loginSubmitButton).toBeVisible();
        const colour = await this.bankPrimaryColour();
        await expect.poll(() => this.backgroundOf(this.loginSubmitButton)).toBe(colour);
        await expect(this.page.getByText(BANK_NAME, { exact: true }).first()).toBeVisible();
    }

    // Shell: bank name, active nav, avatar and primary create buttons carry the Login bank colour; the brand
    // is the bank's, not the default Harbor CRM fallback, so this also holds right after a reload.
    async assertShellUsesBankTheme() {
        const colour = await this.bankPrimaryColour();
        await expect(this.shellBrandName).toHaveText(BANK_NAME, { timeout: 15000 });
        await expect.poll(() => this.backgroundOf(this.avatarCircle)).toBe(colour);
        await expect.poll(() => this.backgroundOf(this.activeNavLink)).not.toBe('rgba(0, 0, 0, 0)');
        await expect.poll(() => this.backgroundOf(this.activeNavLink)).not.toBe('rgb(11, 15, 25)');
        await expect.poll(async () => {
            const backgrounds = await this.primaryCreateButtons.evaluateAll(
                buttons => buttons.map(button => getComputedStyle(button).backgroundColor)
            );
            return backgrounds.every(background => background === colour);
        }, 'primary create buttons use --bank-primary').toBe(true);
    }
}
