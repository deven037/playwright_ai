import { BasePage } from '@core/BasePage';
import { expect, Locator, Page } from '@playwright/test';
import { HARBOR_LIST_METRICS, HARBOR_VIEWPORTS, LEADS_SUBTITLE_PATTERN, VIEWER_READ_ONLY_MESSAGE } from '../../data/leadsHarbor.data';

// AIO-411 / AIO-T225: Leads Harbor parity (list, record, form) and role access.
export class LeadsHarborPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async waitForPageLoad(): Promise<void> {
        await this.helpers.assertVisible(this.page.getByRole('heading', { level: 1 }), 'Page title');
    }

    private get title() { return this.page.getByRole('heading', { level: 1 }); }
    private get newLeadButton() { return this.page.getByRole('button', { name: '+ New Lead' }); }
    private get exportButton() { return this.page.getByTestId('export-csv-btn'); }
    private get tableViewButton() { return this.page.getByTestId('view-table'); }
    private get triageViewButton() { return this.page.getByTestId('view-triage'); }
    private get searchBox() { return this.page.getByRole('searchbox', { name: 'Search leads' }); }
    private get statusPills() { return this.page.getByTestId('lead-status'); }

    // Computed style of a locator, retried until the page has rendered the element.
    private async assertComputed(locator: Locator, property: string, expected: string, label: string) {
        await expect
            .poll(() => locator.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property), { message: label })
            .toBe(expected);
    }

    private async assertRenderedHeight(locator: Locator, expected: number, label: string) {
        await expect
            .poll(() => locator.evaluate((el) => Math.round(el.getBoundingClientRect().height)), { message: label })
            .toBe(expected);
    }

    async openLeadsAt(size: keyof typeof HARBOR_VIEWPORTS) {
        await this.helpers.setViewport(HARBOR_VIEWPORTS[size]);
        await this.navigateTo('/leads');
        await this.helpers.assertVisible(this.title, 'Leads title');
    }

    async openPath(path: string) {
        await this.navigateTo(path);
        await this.helpers.assertVisible(this.title, 'Page title');
    }

    async assertListHeader(canCreate: boolean) {
        await expect(this.title).toHaveText('Leads');
        await expect(this.page.getByText(LEADS_SUBTITLE_PATTERN)).toBeVisible();
        if (canCreate) {
            await this.helpers.assertVisible(this.newLeadButton, '+ New Lead');
        } else {
            await expect(this.newLeadButton).toHaveCount(0);
            await expect(this.exportButton).toHaveCount(0);
        }
    }

    async assertTitleFontSize(px: number) {
        await this.assertComputed(this.title, 'font-size', `${px}px`, 'Title font size');
    }

    async assertListControlHeights(size: 'desktop' | 'phone', canCreate: boolean) {
        const height = HARBOR_LIST_METRICS[size].controlHeight;
        const controls: Array<[Locator, string]> = [
            [this.tableViewButton, 'Table view button'],
            [this.triageViewButton, 'Triage view button'],
        ];
        if (canCreate) {
            controls.push([this.newLeadButton, '+ New Lead'], [this.exportButton, 'Export CSV']);
        }
        for (const [locator, label] of controls) {
            await this.assertRenderedHeight(locator, height, `${label} height`);
        }
        await this.assertRenderedHeight(this.searchBox, HARBOR_LIST_METRICS.searchHeight, 'Search height');
        await this.assertComputed(this.searchBox, 'border-top-left-radius', `${HARBOR_LIST_METRICS.searchRadius}px`, 'Search radius');
        if (canCreate) {
            await this.assertComputed(this.newLeadButton, 'border-top-left-radius', `${HARBOR_LIST_METRICS.newLeadRadius}px`, 'New Lead radius');
        }
    }

    async assertPageWidthWithinDesign() {
        const width = await this.page.getByRole('main').evaluate((el) => Math.round(el.getBoundingClientRect().width));
        expect(width, 'main content width').toBeLessThanOrEqual(HARBOR_LIST_METRICS.maxPageWidth);
    }

    async assertDesktopTableMetrics() {
        await this.helpers.assertVisible(this.statusPills.first(), 'Lead status pill');
        const header = this.page.locator('table thead th').first();
        await this.assertComputed(header, 'font-size', `${HARBOR_LIST_METRICS.tableHeaderFont}px`, 'Table header font');
        await this.assertRenderedHeight(header, HARBOR_LIST_METRICS.tableHeaderHeight, 'Table header height');
        await this.assertRenderedHeight(this.page.locator('table tbody tr').first(), HARBOR_LIST_METRICS.tableRowHeight, 'Table row height');
        await expect(this.page.getByRole('checkbox', { name: 'Select all' })).toBeVisible();
    }

    async assertNoConvertButtonInRows() {
        await expect(this.page.locator('table tbody').getByRole('button', { name: 'Convert', exact: true })).toHaveCount(0);
    }

    async assertPhoneCardList() {
        await this.helpers.assertVisible(this.page.getByRole('button', { name: /^Actions for / }).first(), 'Lead card actions');
        await expect(this.page.getByRole('table')).toBeHidden();
        expect(await this.helpers.getHorizontalOverflow(), 'horizontal overflow').toBeLessThanOrEqual(0);
    }

    async assertRecordTitle(px: number) {
        await this.helpers.assertVisible(this.page.getByTestId('lead-detail-page'), 'Lead record');
        await this.assertTitleFontSize(px);
    }

    async assertCreateFormAvailable() {
        await this.helpers.assertVisible(this.page.getByTestId('lead-form-page'), 'New lead form');
        await this.helpers.assertVisible(this.page.getByRole('button', { name: 'Create lead', exact: true }), 'Create lead');
    }

    async assertViewerCannotCreate() {
        await this.helpers.assertVisible(this.page.getByText(VIEWER_READ_ONLY_MESSAGE), 'Read-only message');
        await expect(this.page.getByRole('button', { name: 'Create lead', exact: true })).toHaveCount(0);
    }

    async selectAllAndAssertBulkBar(actions: readonly string[]) {
        await this.helpers.setChecked(this.page.getByRole('checkbox', { name: 'Select all' }), true, 'Select all');
        for (const action of actions) {
            await this.helpers.assertVisible(this.page.getByRole('button', { name: action }), `${action} bulk action`);
        }
        await this.helpers.setChecked(this.page.getByRole('checkbox', { name: 'Select all' }), false, 'Select all');
    }

    async openAdjacentPage(linkName: string, urlPattern: RegExp) {
        await this.helpers.click(this.page.getByRole('link', { name: linkName, exact: true }), linkName);
        await this.helpers.assertURL(urlPattern);
        await this.helpers.assertVisible(this.title, `${linkName} title`);
    }
}
