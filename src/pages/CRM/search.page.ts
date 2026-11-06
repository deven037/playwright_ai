import { BasePage } from '@core/BasePage';
import { expect, Route } from '@playwright/test';
import {
    CLEAR_BUTTON_MIN_PX, COUNT_FOOTER, COUNT_TOTALS, LEADS_PAGE_SIZE, LEADS_PAGINATION_LABEL, SEARCH_LABEL,
    SEARCH_MATCH_COUNT, SEARCH_MODULES, SEARCH_RECORDS, SEARCH_ROWS_PER_TYPE, SEARCH_TERMS, SEARCH_TYPES,
    SearchModule, SearchType, groupName, searchResponse, seeAllLabel,
} from '../../data/search.data';

export class SearchPage extends BasePage {
    private releaseSearch?: () => void;
    private heldTerm?: string;
    private heldRequest?: Promise<void>;
    private markHeld?: () => void;
    private gate?: Promise<void>;
    private readonly apiPattern = '**/api/**';
    private searchRequests = 0;
    private consoleErrors: string[] = [];
    private lastApiTotals?: Record<SearchType, number>;
    private get panel() { return this.page.getByTestId('command-bar'); }
    private get input() { return this.panel.getByRole('combobox', { name: SEARCH_LABEL }); }
    private get footer() { return this.panel.getByTestId('search-total'); }
    private get clearIconButton() { return this.panel.getByRole('button', { name: 'Clear search', exact: true }); }
    private group(type: SearchType, total: number) { return this.panel.getByRole('group', { name: groupName(type, total) }); }
    private rows(type: SearchType) { return this.panel.getByTestId(`search-result-${type}`); }
    private list(module: SearchModule) { return this.page.getByTestId(`${module}-page`); }
    private box(module: SearchModule) { return this.list(module).getByRole('searchbox'); }

    async waitForPageLoad() {
        await this.helpers.waitForElement(this.page.getByTestId('leads-page'));
    }

    private readonly fixtureRoute = async (route: Route) => {
        const url = new URL(route.request().url());
        if (route.request().method() !== 'GET') return route.continue();
        if (url.pathname === '/api/search') {
            const term = url.searchParams.get('q') ?? '';
            if (term === this.heldTerm) {
                this.markHeld?.();
                await this.gate;
            }
            return route.fulfill({ json: searchResponse(term) });
        }
        const module = SEARCH_MODULES.find(key => url.pathname === `/api/${key}`);
        if (!module) return route.continue();
        const data = SEARCH_RECORDS[module];
        return route.fulfill({ json: { data, total: data.length, page: 1, pageSize: 100, totalPages: 1 } });
    };

    async installFixtures() {
        await this.page.route(this.apiPattern, this.fixtureRoute);
    }

    async cleanupFixtures() {
        this.releaseSearch?.();
        await this.page.unroute(this.apiPattern, this.fixtureRoute);
    }

    async openList(module: SearchModule) {
        await this.helpers.click(this.page.getByRole('link', { name: new RegExp(`^${module}$`, 'i') }));
        await this.helpers.assertURL(new RegExp(`/${module}$`));
        if (module === 'contacts') await this.helpers.click(this.list(module).getByTestId('view-list'));
        await this.helpers.waitForElement(this.box(module));
    }

    async searchFor(term: string, module: SearchModule) {
        await this.helpers.click(this.page.getByTestId('global-search'));
        await this.helpers.fill(this.input, term);
        await expect(this.panel.getByTestId(`search-see-all-${module}`)).toHaveText(seeAllLabel(module));
        await expect(this.input).toHaveAttribute('aria-busy', 'false');
    }

    async seeAll(term: string, module: SearchModule) {
        await this.searchFor(term, module);
        await this.helpers.click(this.panel.getByTestId(`search-see-all-${module}`));
        await expect(this.panel).toHaveCount(0);
    }

    async assertList(module: SearchModule, term: string) {
        // [?] matches the literal query delimiter without escape-sequence ambiguity
        await this.helpers.assertURL(new RegExp(`/${module}[?]q=${term}$`));
        await expect(this.box(module)).toHaveValue(term);
        const expectedRows = module === 'leads' ? LEADS_PAGE_SIZE : SEARCH_MATCH_COUNT;
        const rows = this.list(module).locator('tbody tr.row-clickable');
        await expect(rows).toHaveCount(expectedRows);
        await expect(rows.filter({ hasText: term })).toHaveCount(expectedRows);
        if (module === 'leads') await expect(this.list(module).getByTestId('pagination')).toContainText(LEADS_PAGINATION_LABEL);
    }

    async goToSecondPage() {
        await this.helpers.click(this.list('leads').getByRole('button', { name: 'Next page' }));
        await expect(this.list('leads').getByTestId('pagination')).toContainText('page 2 of');
    }

    async editListToNoMatches(module: SearchModule) {
        await this.helpers.fill(this.box(module), SEARCH_TERMS.absent);
        await expect(this.list(module).locator('tbody tr.row-clickable')).toHaveCount(0);
    }

    async assertEnterWaitsForCurrentResults() {
        this.heldTerm = SEARCH_TERMS.second;
        this.gate = new Promise<void>(resolve => { this.releaseSearch = resolve; });
        this.heldRequest = new Promise<void>(resolve => { this.markHeld = resolve; });
        try {
            await this.searchFor(SEARCH_TERMS.first, 'leads');
            await this.helpers.fill(this.input, SEARCH_TERMS.second);
            await this.helpers.pressKey(this.input, 'Enter');
            await expect(this.panel).toBeVisible();
            await this.helpers.assertURL(/\/leads$/);
            await this.heldRequest;
            await expect(this.input).toHaveAttribute('aria-busy', 'true');
            await this.helpers.pressKey(this.input, 'Enter');
            await expect(this.panel).toBeVisible();
            await this.helpers.assertURL(/\/leads$/);
            this.releaseSearch();
            await expect(this.input).toHaveAttribute('aria-busy', 'false');
            await expect(this.panel.getByTestId('search-see-all-leads')).toHaveText(seeAllLabel('leads'));
            await this.helpers.pressKey(this.input, 'Enter');
            await this.assertList('leads', SEARCH_TERMS.second);
        } finally {
            this.releaseSearch?.();
            this.heldTerm = undefined;
        }
    }

    // --- AIO-211: live staging search (counts come from the API) -------------

    /** Counts /api/search requests and page console errors from now on. */
    trackSearchActivity() {
        this.searchRequests = 0;
        this.consoleErrors = [];
        this.page.on('request', request => {
            if (new URL(request.url()).pathname === '/api/search') this.searchRequests++;
        });
        this.page.on('console', message => {
            if (message.type() === 'error') this.consoleErrors.push(message.text());
        });
    }

    async openSearch() {
        await this.helpers.click(this.page.getByTestId('global-search'));
        await this.helpers.waitForElement(this.input);
    }

    /** Types a term and waits for the API response; keeps its totals for later comparison. */
    async typeAndAwaitApi(term: string) {
        const response = this.page.waitForResponse(res =>
            new URL(res.url()).pathname === '/api/search' && new URL(res.url()).searchParams.get('q') === term);
        await this.helpers.fill(this.input, term);
        const body = await (await response).json();
        this.lastApiTotals = Object.fromEntries(SEARCH_TYPES.map(type => [type, body[type].total])) as Record<SearchType, number>;
        await expect(this.input).toHaveAttribute('aria-busy', 'false');
    }

    async typeWithoutApi(term: string) {
        await this.helpers.fill(this.input, term);
    }

    async assertGroupsAndRows(totals: Record<SearchType, number>) {
        for (const type of SEARCH_TYPES) {
            await expect(this.group(type, totals[type])).toBeVisible();
            await expect(this.group(type, totals[type]).getByTestId(`search-result-${type}`))
                .toHaveCount(Math.min(totals[type], SEARCH_ROWS_PER_TYPE));
        }
        await expect(this.panel.locator('mark').first()).toBeVisible();
    }

    async assertFooterMatchesApi() {
        const totals = this.lastApiTotals!;
        expect(totals).toEqual(COUNT_TOTALS);
        const sum = SEARCH_TYPES.reduce((acc, type) => acc + totals[type], 0);
        await expect(this.footer).toHaveText(`${sum} results in ${SEARCH_TYPES.length} types`);
        await expect(this.footer).toHaveText(COUNT_FOOTER);
    }

    async assertSeeAll(labels: Partial<Record<SearchType, string>>) {
        for (const type of SEARCH_TYPES) {
            const link = this.panel.getByTestId(`search-see-all-${type}`);
            const label = labels[type];
            if (label) await expect(link).toHaveText(label);
            else await expect(link).toHaveCount(0);
        }
    }

    async assertDealHighlightsNameOnly(total: number) {
        const deals = this.rows('deals');
        await expect(deals).toHaveCount(Math.min(total, SEARCH_ROWS_PER_TYPE));
        await expect(deals.locator('strong mark')).toHaveCount(await deals.count());
        await expect(deals.locator('small mark')).toHaveCount(0);
    }

    async assertNoMatches(term: string, heading: string) {
        const empty = this.panel.getByTestId('search-empty');
        await expect(empty).toContainText(heading);
        await expect(empty.getByRole('button', { name: 'Clear search', exact: true })).toBeVisible();
        await expect(this.footer).toHaveCount(0);
        expect(term.length).toBeGreaterThan(0);
    }

    async assertShortTermHint(hint: string) {
        await expect(this.panel.getByTestId('search-short-hint')).toHaveText(hint);
        for (const type of SEARCH_TYPES) await expect(this.rows(type)).toHaveCount(0);
        expect(this.searchRequests).toBe(0);
    }

    async clearSearchFromEmptyState() {
        await this.helpers.click(this.panel.getByTestId('search-empty').getByRole('button', { name: 'Clear search', exact: true }));
        await expect(this.input).toHaveValue('');
        await expect(this.input).toBeFocused();
    }

    async setViewport(size: { width: number; height: number }) {
        await this.page.setViewportSize(size);
    }

    async assertNoHorizontalOverflow() {
        const overflow = await this.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
    }

    async assertClearButtonTouchTarget() {
        await expect(this.clearIconButton).toBeVisible();
        const box = await this.clearIconButton.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(CLEAR_BUTTON_MIN_PX);
        expect(box!.height).toBeGreaterThanOrEqual(CLEAR_BUTTON_MIN_PX);
    }

    async assertResultsPanelShown() {
        await expect(this.panel).toBeVisible();
        await expect(this.rows('leads').first()).toBeVisible();
    }

    async openFirstResultWithKeyboard(url: RegExp) {
        await this.helpers.pressKey(this.input, 'ArrowDown');
        await expect(this.input).toHaveAttribute('aria-activedescendant', 'command-option-0');
        await this.helpers.pressKey(this.input, 'Enter');
        await this.helpers.assertURL(url);
    }

    assertNoConsoleErrors() {
        expect(this.consoleErrors).toEqual([]);
    }

    async assertNoRowsContain(type: SearchType, text: string) {
        await expect(this.rows(type).filter({ hasText: text })).toHaveCount(0);
    }

    async assertRowsHideContactDetails(type: SearchType) {
        const rows = this.rows(type);
        await expect(rows.first()).toBeVisible();
        await expect(rows.filter({ hasText: /@|\d{3}[\s-]?\d{3}/ })).toHaveCount(0);
    }
}
