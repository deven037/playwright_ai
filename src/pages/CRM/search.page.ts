import { BasePage } from '@core/BasePage';
import { expect, Route } from '@playwright/test';
import {
    LEADS_PAGE_SIZE, LEADS_PAGINATION_LABEL, SEARCH_FAILURE_RESPONSE, SEARCH_FAILURE_TITLE, SEARCH_LABEL,
    SEARCH_MATCH_COUNT, SEARCH_MODULES, SEARCH_RECORDS, SEARCH_TERMS, SearchModule, searchResponse, seeAllLabel,
} from '../../data/search.data';

export class SearchPage extends BasePage {
    private releaseSearch?: () => void;
    private heldTerm?: string;
    private heldRequest?: Promise<void>;
    private markHeld?: () => void;
    private gate?: Promise<void>;
    private failedSearchRequests = 0;
    private readonly apiPattern = '**/api/**';
    private readonly failSearchPattern = '**/api/search?**';
    private get opener() { return this.page.getByTestId('global-search'); }
    private get panel() { return this.page.getByTestId('command-bar'); }
    private get input() { return this.panel.getByRole('combobox', { name: SEARCH_LABEL }); }
    private get retryButton() { return this.panel.getByRole('button', { name: 'Try again', exact: true }); }
    private get closeButton() { return this.panel.getByRole('button', { name: 'Close', exact: true }); }
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

    private readonly failSearchRoute = async (route: Route) => {
        this.failedSearchRequests++;
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify(SEARCH_FAILURE_RESPONSE) });
    };

    async installFixtures() {
        await this.page.route(this.apiPattern, this.fixtureRoute);
    }

    /** Forces the search error state without changing server data; counts the failed requests. */
    async failSearchRequests() {
        this.failedSearchRequests = 0;
        await this.page.route(this.failSearchPattern, this.failSearchRoute);
    }

    async cleanupFixtures() {
        this.releaseSearch?.();
        await this.page.unroute(this.apiPattern, this.fixtureRoute);
        await this.page.unroute(this.failSearchPattern, this.failSearchRoute);
    }

    async openList(module: SearchModule) {
        await this.helpers.click(this.page.getByRole('link', { name: new RegExp(`^${module}$`, 'i') }));
        await this.helpers.assertURL(new RegExp(`/${module}$`));
        if (module === 'contacts') await this.helpers.click(this.list(module).getByTestId('view-list'));
        await this.helpers.waitForElement(this.box(module));
    }

    async openWithShortcutFromHeader() {
        await this.opener.focus();
        await this.page.keyboard.press('Control+k');
        await expect(this.input).toBeFocused();
    }

    async openFromHeader() {
        await this.helpers.click(this.opener, 'Global search');
    }

    async assertInputFocused() {
        await expect(this.input).toBeFocused();
    }

    async typeTerm(term: string) {
        await this.helpers.fill(this.input, term);
    }

    async assertSearchFailedWithRetryFocused() {
        await expect(this.panel.getByText(SEARCH_FAILURE_TITLE, { exact: true })).toBeVisible();
        await expect(this.retryButton).toBeFocused();
    }

    async assertRetryFocused() {
        await expect(this.retryButton).toBeFocused();
    }

    async retrySearch() {
        const previousRequests = this.failedSearchRequests;
        await this.helpers.click(this.retryButton, 'Try again');
        await expect.poll(() => this.failedSearchRequests).toBeGreaterThan(previousRequests);
    }

    async assertRetryCompletedKeepingTerm(term: string) {
        await expect(this.input).toHaveAttribute('aria-busy', 'false');
        await expect(this.retryButton).toBeFocused();
        await expect(this.input).toHaveValue(term);
    }

    async focusClose() {
        await this.closeButton.focus();
    }

    async pressEscape() {
        await this.page.keyboard.press('Escape');
    }

    async assertClosedWithOpenerFocused() {
        await expect(this.panel).toHaveCount(0);
        await expect(this.opener).toBeFocused();
    }

    async searchFor(term: string, module: SearchModule) {
        await this.helpers.click(this.opener);
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
}
