import { BasePage } from '@core/BasePage';
import { expect, Route } from '@playwright/test';
import {
    LEADS_PAGE_SIZE, LEADS_PAGINATION_LABEL, SEARCH_LABEL, SEARCH_MATCH_COUNT, SEARCH_MODULES, SEARCH_RECORDS,
    SEARCH_TERMS, SearchModule, searchResponse, seeAllLabel, SEARCH_API_GROUPS, SEARCH_GROUPING_TERM,
    SEARCH_LIVE_PATHS, SEARCH_PER_TYPE_LIMIT, SearchApiBody, formatPhoneWithSeparators,
    SEARCH_ROLE_EMAILS, SearchRole, SEARCH_SEEDED_LEAD,
} from '../../data/search.data';
import { CrmLoginPage } from './crm.login.page';
import { DashboardPage } from './dashboard.page';

export class SearchPage extends BasePage {
    private releaseSearch?: () => void;
    private heldTerm?: string;
    private heldRequest?: Promise<void>;
    private markHeld?: () => void;
    private gate?: Promise<void>;
    private readonly apiPattern = '**/api/**';
    private get panel() { return this.page.getByTestId('command-bar'); }
    private get input() { return this.panel.getByRole('combobox', { name: SEARCH_LABEL }); }
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

    private async searchLive(term: string): Promise<SearchApiBody> {
        const response = this.page.waitForResponse(r => r.request().method() === 'GET'
            && new URL(r.url()).pathname === SEARCH_LIVE_PATHS.search && new URL(r.url()).searchParams.get('q') === term);
        if (!(await this.panel.isVisible())) await this.helpers.click(this.page.getByTestId('global-search'));
        // Clear first so a repeated term is a real input change and sends a new request.
        await this.helpers.fill(this.input, '');
        await this.helpers.fill(this.input, term);
        const result = await response;
        expect(result.status()).toBe(200);
        return result.json();
    }

    async signInAs(role: SearchRole) {
        const loginPage = new CrmLoginPage(this.page);
        await loginPage.goto();
        await loginPage.loginWithCustomCredentials(SEARCH_ROLE_EMAILS[role]);
        await new DashboardPage(this.page).waitForDashBoardPage();
    }

    private static allHits(body: SearchApiBody) {
        return SEARCH_API_GROUPS.flatMap(group => body[group].items);
    }

    async assertGroupedResultsWithTotals() {
        const body = await this.searchLive(SEARCH_GROUPING_TERM);
        expect(body.term).toBe(SEARCH_GROUPING_TERM);
        for (const group of SEARCH_API_GROUPS) {
            const { items, total } = body[group];
            expect(Number.isInteger(total), `${group} total is a number`).toBe(true);
            expect(items.length, `${group} items`).toBeLessThanOrEqual(SEARCH_PER_TYPE_LIMIT);
            expect(items.length, `${group} items vs total`).toBe(Math.min(total, SEARCH_PER_TYPE_LIMIT));
        }
        // 'an' matches more than the per-type limit in leads, so the cap is proven against the real total.
        expect(body.leads.total, 'leads total above the per-type limit').toBeGreaterThan(SEARCH_PER_TYPE_LIMIT);
        expect(body.leads.items, 'leads capped').toHaveLength(SEARCH_PER_TYPE_LIMIT);
    }

    async assertContactDetailsReturnedAndMatched() {
        const { id, email, phoneDigits } = SEARCH_SEEDED_LEAD;
        const byEmail = await this.searchLive(email);
        expect(byEmail.leads.items.map(hit => hit.id), 'leads matched by email').toContain(id);
        const byPhone = await this.searchLive(formatPhoneWithSeparators(phoneDigits));
        expect(byPhone.leads.items.map(hit => hit.id), 'leads matched by formatted phone').toContain(id);
        const hit = byEmail.leads.items.find(item => item.id === id);
        expect(hit?.email, 'email returned').toBe(email);
        expect(hit?.phone, 'phone returned').toBeTruthy();
    }

    async assertContactDetailsHiddenAndNotMatched() {
        const { id, email, phoneDigits } = SEARCH_SEEDED_LEAD;
        const byName = await this.searchLive(SEARCH_GROUPING_TERM);
        expect(SearchPage.allHits(byName).length, 'hits to inspect').toBeGreaterThan(0);
        expect(SearchPage.allHits(byName).filter(hit => 'email' in hit || 'phone' in hit), 'hits with email/phone').toEqual([]);
        const byEmail = await this.searchLive(email);
        expect(byEmail.leads.items.map(hit => hit.id), 'leads matched by email').not.toContain(id);
        expect(SearchPage.allHits(byEmail).filter(hit => 'email' in hit || 'phone' in hit), 'hits with email/phone').toEqual([]);
        const byPhone = await this.searchLive(formatPhoneWithSeparators(phoneDigits));
        expect(byPhone.leads.items.map(hit => hit.id), 'leads matched by phone').not.toContain(id);
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
