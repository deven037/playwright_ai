import { BasePage } from '../../core/BasePage';
import { Page, expect } from '@playwright/test';
import { REQUIRED_TOKENS, TOKEN_PREFIXES, VIEWPORT_HEIGHT } from '../../data/theme.data';

// Harbor theme variables (AIO-134 / AIO-T155, AIO-T156).
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
        const baseUrl = this.env.newAppBaseUrl?.trim();
        if (!baseUrl) {
            throw new Error('NEWAPP_BASE_URL is not configured. Set it in .env or CI environment variables.');
        }
        await this.page.goto(`${baseUrl.replace(/\/+$/, '')}/leads`);
    }

    async assertLeadsListed() {
        await expect(this.leadRows.first()).toBeVisible();
    }
}
