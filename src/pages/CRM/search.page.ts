import { Page, expect } from "@playwright/test";
import { BasePage } from "../../core/BasePage";

export class SearchPage extends BasePage {

    constructor(page: Page) {
        super(page);
    }

    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
    }

    private get opener() {
        return this.page.getByTestId('global-search');
    }

    private get panel() {
        return this.page.getByTestId('command-bar');
    }

    private get input() {
        return this.panel.getByRole('combobox', { name: 'Search leads, contacts, accounts and deals' });
    }

    private group(label: string) {
        return this.panel.getByRole('group', { name: new RegExp(`^${label}`) });
    }

    private get contactNames() {
        return this.page.locator("//div[@class='contact-name']");
    }

    private get accountRows() {
        return this.page.locator('tbody > tr');
    }

    async searchFor(term: string) {
        await this.helpers.click(this.opener, 'Global search');
        await this.helpers.fill(this.input, term, 'Global search input');
        await this.helpers.waitForElement(this.panel.getByTestId('search-total'), 'visible', 'Search total');
    }

    async assertGroupTotal(label: string, total: number) {
        await expect(this.group(label)).toContainText(`${total} matches`);
    }

    async assertResultListed(label: string, name: string, detail: string) {
        const result = this.group(label).getByTestId(`search-result-${label.toLowerCase()}`).filter({ hasText: name });
        await expect(result).toContainText(detail);
    }

    async clickSeeAll(label: string, seeAllText: string) {
        const seeAll = this.group(label).getByRole('option', { name: seeAllText, exact: true });
        await this.helpers.click(seeAll, seeAllText);
    }

    async assertContactListed(name: string) {
        await expect(this.contactNames.filter({ hasText: name })).toHaveCount(1);
    }

    async assertContactCount(count: number) {
        await expect(this.contactNames).toHaveCount(count);
    }

    async assertAccountRowCount(count: number) {
        await expect(this.accountRows).toHaveCount(count);
    }

    async assertUrlMatches(pattern: RegExp) {
        await this.helpers.assertURL(pattern);
    }
}
