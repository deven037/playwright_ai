import { AuthManager } from '../../utils/AuthManager';
import { Helpers } from '../../utils/Helpers';
import { CrmLoginPage } from './crm.login.page';
import { DashboardPage } from './dashboard.page';
import { BasePage } from '@core/BasePage';
import { expect, Route, Page, BrowserContext, Locator } from '@playwright/test';
import {
    HEADER_SEARCH_CHECKS, SEARCH_ERROR, LEADS_PAGE_SIZE, LEADS_PAGINATION_LABEL, SEARCH_LABEL, SEARCH_MATCH_COUNT, SEARCH_MODULES, SEARCH_RECORDS,
    SEARCH_TERMS, SearchModule, searchResponse, seeAllLabel, SEARCH_API_GROUPS, SEARCH_GROUPING_TERM,
    SEARCH_LIVE_PATHS, SEARCH_PER_TYPE_LIMIT, SearchApiBody, formatPhoneWithSeparators,
    SEARCH_ROLE_EMAILS, SearchRole, SEARCH_SEEDED_LEAD, LIST_LOAD_TIMEOUT,
    searchTypes, searchRoles, searchText, searchTerms, searchFixtures, emptySearchResponse, controlledSearchResponse,
} from '../../data/search.data';

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
        await this.page.unroute('**/api/search?**', this.errorRoute);
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
        await this.helpers.click(this.opener(this.page));
        await this.helpers.fill(this.input, term);
        await expect(this.globalSeeAll(this.page, module)).toHaveText(seeAllLabel(module));
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
        if (!(await this.panel.isVisible())) await this.helpers.click(this.opener(this.page));
        // Observe a rendered short term before refilling, so repeated queries trigger a new debounce.
        await this.helpers.fill(this.input, HEADER_SEARCH_CHECKS.short);
        await expect(this.panel.getByTestId('search-short-hint')).toBeVisible();
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
    private opener(page: Page) { return page.getByRole('button', { name: /Search leads, contacts, accounts/ }); }
    private globalInput(page: Page) { return page === this.page ? this.input : this.globalPanel(page).getByRole('combobox', { name: SEARCH_LABEL }); }
    private globalPanel(page: Page) { return page === this.page ? this.panel : page.getByTestId('command-bar'); }
    private result(page: Page, type: string) { return page.getByTestId(`search-result-${type}`); }
    private globalSeeAll(page: Page, type: string) { return page.getByTestId(`search-see-all-${type}`); }
    private loading(page: Page) { return page.getByTestId('search-loading'); }
    private emptyState(page: Page) { return page.getByTestId('search-empty'); }
    // Scoped to the search panel: the page behind it has its own group roles.
    private groups(page: Page) { return this.globalPanel(page).getByRole('group'); }
    private namedGroup(page: Page, name: string) { return this.globalPanel(page).getByRole('group', { name, exact: true }); }
    private alert(page: Page) { return this.globalPanel(page).getByRole('alert'); }
    private retryButton(page: Page) { return page.getByRole('button', { name: searchText.retry, exact: true }); }
    private modulePage(page: Page, type: string) { return page.getByTestId(`${type}-page`); }
    private filterChip(module: Locator, label: string) { return module.getByRole('button', { name: label, exact: true }); }
    private kanbanTitles(module: Locator) { return module.locator('.kanban-card-title'); }
    private searchbox(module: Locator) { return module.getByRole('searchbox'); }
    private rowText(module: Locator, name: string) { return module.getByText(name, { exact: true }); }
    private statusRegion(page: Page) { return this.globalPanel(page).getByRole('status'); }
    private fulfill(route: Route, body: unknown) {
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    }

    async stubSearchResults() {
        const page = this.page;
        const requests: string[] = [];
        await page.route('**/api/search?**', async route => {
            const term = new URL(route.request().url()).searchParams.get(searchTerms.minimum)!;
            requests.push(term);
            await this.fulfill(route, controlledSearchResponse(term));
        });
        return requests;
    }

    async failFirstSearchRequest() {
        const page = this.page;
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const terms: string[] = [];
        await page.route('**/api/search?**', async route => {
            const term = new URL(route.request().url()).searchParams.get(searchTerms.minimum)!;
            terms.push(term);
            if (terms.length === 1) {
                await gate;
                await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
            } else await this.fulfill(route, emptySearchResponse(term));
        });

        return { terms, release };
    }

    async delayOlderResponse() {
        const page = this.page;
        let release!: () => void;
        let completed!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const finished = new Promise<void>(resolve => { completed = resolve; });
        await page.route('**/api/search?**', async route => {
            const term = new URL(route.request().url()).searchParams.get(searchTerms.minimum)!;
            if (term === searchTerms.older) {
                await gate;
                await this.fulfill(route, controlledSearchResponse(term));
                completed();
            } else await this.fulfill(route, emptySearchResponse(term));
        });

        return { release, finished };
    }

    async assertKnownRecordsAndRolePermissions(workerIndex: number) {
        let page = this.page;
        let helpers = this.helpers;
        const roleContexts: BrowserContext[] = [];
        const base = process.env.NEWAPP_BASE_API?.replace(/\/$/, '');
        expect(base, 'NEWAPP_BASE_API must identify staging').toBeTruthy();
        expect(new URL(base!).hostname).toBe('crm-practice-api.onrender.com');
        const token = await page.evaluate(() => sessionStorage.getItem('crm.token') ?? localStorage.getItem('crm.token'));
        expect(token).toBeTruthy();
        const adminHeaders = { Authorization: `Bearer ${token}` };
        const created: { type: string; id: string }[] = [];
        const prefix = `qa204${Date.now()}${workerIndex}`;
        // Fixed-length 10-digit phone, unique per run: 555 + last 7 digits of the timestamp.
        const phone = `555${String(Date.now() % 10_000_000).padStart(7, '0')}`;
        expect(phone).toMatch(/^\d{10}$/);
        const email = `${prefix}@example.com`;
        const api = async (path: string, method = 'GET', data?: unknown, headers = adminHeaders) => {
            const response = await page.request.fetch(`${base}/api/${path}`, { method, data, headers });
            expect(response.status(), `${method} ${path}: ${await response.text()}`).toBe(method === 'POST' ? 201 : method === 'DELETE' ? 204 : 200);
            return response.status() === 204 ? null : response.json();
        };
        const create = async (type: string, data: object) => {
            const row = await api(type, 'POST', data);
            created.push({ type, id: row.id });
            return row;
        };
        const search = async (term: string, headers = adminHeaders) =>
            api(`search?q=${encodeURIComponent(term)}&limit=3`, 'GET', undefined, headers);
        try {
            const users = await api('users?pageSize=100');
            const owner = users.data.find((user: any) => user.role === 'admin');
            expect(owner, 'Rep must find records owned by Admin').toBeTruthy();
            const ownerId = owner.id;
            const records: Record<string, any[]> = Object.fromEntries(searchTypes.map(type => [type, []]));
            for (let i = 0; i < 4; i++) {
                const account = await create('accounts', searchFixtures.account(prefix, i, ownerId, phone));
                records.accounts.push(account);
                records.leads.push(await create('leads', searchFixtures.lead(prefix, i, ownerId, email, phone)));
                records.contacts.push(await create('contacts', searchFixtures.contact(prefix, i, account.id, email, phone)));
                records.deals.push(await create('deals', searchFixtures.deal(prefix, i, account.id, ownerId)));
            }
            await create('leads', searchFixtures.convertedLead(prefix, ownerId, email, phone));
            const deleted = await create('leads', searchFixtures.deletedLead(prefix, ownerId, email, phone));
            await api(`leads/${deleted.id}`, 'DELETE');
            created.splice(created.findIndex(row => row.id === deleted.id), 1);
            // Related account matches prefix, but the Deal name does not.
            await create('deals', searchFixtures.unrelatedDeal(records.accounts[0].id, ownerId));

            for (const role of searchRoles) {
                if (role !== 'admin') {
                    const context = await this.page.context().browser()!.newContext({ storageState: AuthManager.getInstance().getAuthFilePath(role) });
                    roleContexts.push(context);
                    page = await context.newPage();
                    helpers = new Helpers(page);
                    const login = new CrmLoginPage(page);
                    await login.goto();
                    await new DashboardPage(page).waitForDashBoardPage();
                }
                const roleToken = await page.evaluate(() => sessionStorage.getItem('crm.token') ?? localStorage.getItem('crm.token'));
                const headers = { Authorization: `Bearer ${roleToken}` };
                const body = await search(prefix, headers);
                for (const type of searchTypes) {
                    expect(body[type].total, `${role} ${type} total excludes forbidden records`).toBe(4);
                    expect(body[type].items).toHaveLength(3);
                    for (const hit of body[type].items) {
                        expect(records[type].map(row => row.id)).toContain(hit.id);
                        if (role === 'viewer') {
                            expect(hit).not.toHaveProperty('email');
                            expect(hit).not.toHaveProperty('phone');
                        }
                    }
                }
                for (const term of [email, phone, phone.slice(0, 3) + ' ' + phone.slice(3), phone.slice(0, 3) + '-' + phone.slice(3), `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`]) {
                    const matched = await search(term, headers);
                    for (const type of searchTypes) {
                        const expected = role === 'viewer' || type === 'deals' || (type === 'accounts' && term === email) ? 0 : 4;
                        expect(matched[type].total, `${role} ${type} matching ${term}`).toBe(expected);
                        if (expected === 0) expect(matched[type].items).toEqual([]);
                    }
                }
                const companyMatches = await search(prefix + ' Company', headers);
                expect(companyMatches.leads.total).toBe(4);
                expect(companyMatches.deals.total).toBe(0);
                await helpers.click(this.opener(page));
                await helpers.fill(this.globalInput(page), prefix);
                for (const type of searchTypes) {
                    await expect(this.result(page, type)).toHaveCount(3);
                    await expect(this.globalSeeAll(page, type)).toHaveText(searchText.seeAll(4, type));
                }
                if (role === 'viewer') {
                    const globalPanel = this.globalPanel(page);
                    await expect(globalPanel).not.toContainText(email);
                    await expect(globalPanel).not.toContainText(phone);
                }
                await helpers.pressPageKey('Escape');
            }

            // Verify navigation AND the destination filter, for every module.
            for (const type of searchTypes) {
              for (const term of [prefix, prefix.slice(1)]) {
                await helpers.click(this.opener(page));
                await helpers.fill(this.globalInput(page), term);
                await helpers.click(this.globalSeeAll(page, type));
                await expect(page).toHaveURL(url => url.pathname === `/${type}` && url.searchParams.get(searchTerms.minimum) === term);
                const module = this.modulePage(page, type);
                await expect(module).toBeVisible();
                if (type === 'deals') {
                    await expect(this.filterChip(module, searchText.filteredBy(term))).toBeVisible();
                    await expect(this.kanbanTitles(module)).toHaveCount(4);
                    expect((await this.kanbanTitles(module).allTextContents()).sort()).toEqual(records.deals.map(row => row.name).sort());
                } else {
                    await expect(this.searchbox(module)).toHaveValue(term);
                    // The list fetches every page of the module (300-1200 ms simulated latency per call), so allow more than the default 10 s.
                    for (const row of records[type]) await expect(this.rowText(module, row.name)).toBeVisible({ timeout: LIST_LOAD_TIMEOUT });
                }
              }
                await helpers.click(this.opener(page));
                await helpers.fill(this.globalInput(page), records[type][0].name);
                await helpers.click(this.result(page, type).filter({ hasText: records[type][0].name }));
                await expect(page).toHaveURL(url => url.pathname === '/' + type + '/' + records[type][0].id);
            }
            await helpers.click(this.opener(page));
            await helpers.fill(this.globalInput(page), records.leads[0].name);
            await expect(this.groups(page)).toHaveCount(1);
            await expect(this.namedGroup(page, searchText.leadsOneMatch)).toBeVisible();
            await helpers.click(this.result(page, 'leads'));
            await expect(page).toHaveURL(new RegExp(`/leads/${records.leads[0].id}$`));
        } finally {
            // Attempt every deletion with the Admin token; a rejected request must not skip the rest.
            const failures: string[] = [];
            try {
                for (const row of [...created].reverse()) {
                    try {
                        const response = await this.page.request.delete(`${base}/api/${row.type}/${row.id}`, { headers: adminHeaders });
                        // 404 means the record is already gone (shared staging can be reset mid-run); the cleanup goal is met.
                        if (![204, 404].includes(response.status())) failures.push(`${row.type}/${row.id}: HTTP ${response.status()} ${await response.text()}`);
                    } catch (error) {
                        failures.push(`${row.type}/${row.id}: ${String(error)}`);
                    }
                }
            } finally {
                await Promise.allSettled(roleContexts.map(context => context.close()));
            }
            expect(failures, 'Isolated staging record cleanup').toEqual([]);
        }
    }

    async assertMinimumDebounceAndKeyboard() {
        const page = this.page;
        const helpers = this.helpers;
        const requests = await this.stubSearchResults();
        await helpers.focus(this.opener(page), 'Header search button');
        await helpers.pressPageKey('Control+k');
        await expect(this.globalInput(page)).toBeFocused();
        await page.clock.install();
        await page.clock.pauseAt(new Date());
        await helpers.fill(this.globalInput(page), searchTerms.minimum);
        await page.clock.runFor(500);
        expect(requests).toEqual([]);
        await helpers.fill(this.globalInput(page), searchTerms.initial);
        await page.clock.runFor(200);
        expect(requests).toEqual([]);
        await helpers.fill(this.globalInput(page), searchTerms.debounced);
        await page.clock.runFor(249);
        expect(requests).toEqual([]);
        await page.clock.runFor(1);
        await expect(this.result(page, 'leads')).toHaveText(searchTerms.debounced + searchText.subtitle);
        expect(requests).toEqual([searchTerms.debounced]);
        await expect(this.statusRegion(page)).toContainText(searchText.announcement);
        await helpers.pressKey(this.globalInput(page), 'ArrowDown', 'Search globalInput');
        await expect(this.result(page, 'leads')).toHaveAttribute('aria-selected', 'true');
        await expect(this.globalInput(page)).toHaveAttribute('aria-activedescendant', await this.result(page, 'leads').getAttribute('id') as string);
        await helpers.pressKey(this.globalInput(page), 'ArrowUp', 'Search globalInput');
        await expect(this.result(page, 'leads')).toHaveAttribute('aria-selected', 'true');
        await helpers.pressKey(this.globalInput(page), 'Escape', 'Search globalInput');
        await expect(this.globalPanel(page)).toHaveCount(0);
        await expect(this.opener(page)).toBeFocused();
        await page.clock.resume();
        await helpers.click(this.opener(page));
        await helpers.fill(this.globalInput(page), searchTerms.initial);
        await expect(this.result(page, 'leads')).toBeVisible();
        await helpers.pressKey(this.globalInput(page), 'ArrowDown', 'Search globalInput');
        await helpers.pressKey(this.globalInput(page), 'Enter', 'Search globalInput');
        await expect(page).toHaveURL(new RegExp(`/leads/${searchText.controlledId}$`));
        // Selecting a result closes the panel; its overlay must not cover the header for the next step.
        await expect(this.globalPanel(page)).toHaveCount(0);
    }

    async assertLoadingErrorRetryAndEmpty() {
        const page = this.page;
        const helpers = this.helpers;
        const { terms, release } = await this.failFirstSearchRequest();
        await helpers.click(this.opener(page));
        await helpers.fill(this.globalInput(page), searchTerms.empty);
        await expect(this.loading(page)).toBeVisible();
        await expect(this.globalInput(page)).toHaveAttribute('aria-busy', 'true');
        release();
        await expect(this.alert(page)).toContainText(searchText.error);
        await helpers.click(this.retryButton(page));
        await expect(this.emptyState(page)).toContainText(searchText.empty(searchTerms.empty));
        expect(terms).toEqual([searchTerms.empty, searchTerms.empty]);
        await expect(this.globalInput(page)).toHaveValue(searchTerms.empty);
        await expect(this.groups(page)).toHaveCount(0);
    }

    async assertNewerResponseIsRetained() {
        const page = this.page;
        const helpers = this.helpers;
        const { release, finished } = await this.delayOlderResponse();
        await helpers.click(this.opener(page));
        await helpers.fill(this.globalInput(page), searchTerms.older);
        await expect(this.loading(page)).toBeVisible();
        await helpers.fill(this.globalInput(page), searchTerms.newer);
        await expect(this.emptyState(page)).toContainText(searchText.empty(searchTerms.newer));
        release();
        await finished;
        // Flush the browser fetch/React work before checking retained results.
        await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
        await expect(this.emptyState(page)).toContainText(searchText.empty(searchTerms.newer));
        // The older term 'an' is a substring of the empty-state guidance ("company"), so check the older result row instead.
        await expect(this.result(page, 'leads')).toHaveCount(0);
        await expect(this.input).toHaveValue(searchTerms.newer);
    }

    private searchErrorRequests = 0;
    private readonly errorRoute = async (route: Route) => {
        this.searchErrorRequests++;
        await route.fulfill({ status: 503, json: SEARCH_ERROR.response });
    };

    async failSearchRequests() {
        await this.page.route('**/api/search?**', this.errorRoute);
    }

    async openErrorSearchWithShortcut() {
        await this.helpers.focus(this.opener(this.page), 'Global search');
        await this.helpers.pressKey(this.opener(this.page), 'Control+k');
        await this.helpers.assertFocused(this.input);
        await this.helpers.fill(this.input, SEARCH_ERROR.term);
        await this.helpers.assertVisible(this.panel.getByText(SEARCH_ERROR.heading, { exact: true }));
        await this.helpers.assertFocused(this.retryButton(this.page));
    }

    async openErrorSearchFromHeader(term: string = SEARCH_ERROR.term) {
        await this.helpers.click(this.opener(this.page));
        // Opening resets query/status and schedules input focus; wait before filling.
        await this.helpers.assertFocused(this.input);
        await this.helpers.fill(this.input, term);
        await this.helpers.assertVisible(this.panel.getByText(SEARCH_ERROR.heading, { exact: true }));
        await this.helpers.assertFocused(this.retryButton(this.page));
    }

    async assertRetryKeepsTermAndFocus() {
        const previousRequests = this.searchErrorRequests;
        await this.helpers.click(this.retryButton(this.page));
        await expect.poll(() => this.searchErrorRequests).toBeGreaterThan(previousRequests);
        await this.helpers.assertAttribute(this.input, 'aria-busy', 'false');
        await this.helpers.assertFocused(this.retryButton(this.page));
        await expect(this.input).toHaveValue(SEARCH_ERROR.term);
    }

    async assertEscapeFromRetryRestoresFocus() {
        await this.helpers.pressKey(this.retryButton(this.page), 'Escape');
        await expect(this.panel).toHaveCount(0);
        await this.helpers.assertFocused(this.opener(this.page));
    }

    async assertEscapeFromCloseRestoresFocus() {
        const close = this.panel.getByRole('button', { name: 'Close', exact: true });
        await this.helpers.focus(close, 'Close search');
        await this.helpers.pressKey(close, 'Escape');
        await expect(this.panel).toHaveCount(0);
        await this.helpers.assertFocused(this.opener(this.page));
    }

    async assertEscapeFromInputRestoresFocus() {
        await this.helpers.click(this.opener(this.page));
        await this.helpers.assertFocused(this.input);
        await this.helpers.pressKey(this.input, 'Escape');
        await expect(this.panel).toHaveCount(0);
        await this.helpers.assertFocused(this.opener(this.page));
    }

    async restoreSearchRequestsAndAssertSuccessfulRetry(term: string) {
        await this.page.unroute('**/api/search?**', this.errorRoute);
        const response = this.page.waitForResponse(r => r.request().method() === 'GET'
            && new URL(r.url()).pathname === SEARCH_LIVE_PATHS.search
            && new URL(r.url()).searchParams.get('q') === term);
        await this.helpers.click(this.retryButton(this.page));
        expect((await response).status()).toBe(200);
        await this.helpers.assertAttribute(this.input, 'aria-busy', 'false');
        await expect(this.input).toHaveValue(term);
        await expect(this.retryButton(this.page)).toHaveCount(0);
        await expect(this.panel.getByTestId('search-result-leads').first()).toBeVisible();
    }

    async assertEscapeFromCurrentFocusRestoresOpener() {
        // Keep the focus left by the successful retry: focusing an input would hide AIO-399.
        await this.helpers.pressPageKey('Escape');
        await expect(this.panel).toHaveCount(0);
        await this.helpers.assertFocused(this.opener(this.page));
    }


    async assertHeaderButtonAndShortcut() {
        await expect(this.page.getByTestId('topbar').getByTestId('global-search')).toHaveCount(1);
        await expect(this.opener(this.page)).toHaveCount(1);
        await this.helpers.click(this.opener(this.page));
        await expect(this.input).toBeVisible();
        await this.helpers.pressKey(this.input, 'Escape');
        await this.helpers.focus(this.opener(this.page));
        await this.helpers.pressPageKey('Control+k');
        await expect(this.input).toBeFocused();
        await expect(this.input).toHaveAccessibleName(SEARCH_LABEL);
    }

    async assertMinimumAndLiveGroupedNavigation() {
        const requests: string[] = [];
        this.page.on('request', request => {
            if (new URL(request.url()).pathname === SEARCH_LIVE_PATHS.search) requests.push(request.url());
        });
        await this.helpers.click(this.opener(this.page));
        await expect(this.input).toBeFocused();
        await this.page.clock.install();
        await this.page.clock.pauseAt(new Date());
        await this.helpers.fill(this.input, HEADER_SEARCH_CHECKS.short);
        await this.page.clock.runFor(500);
        expect(requests).toEqual([]);
        const response = this.page.waitForResponse(r => new URL(r.url()).pathname === SEARCH_LIVE_PATHS.search
            && new URL(r.url()).searchParams.get('q') === HEADER_SEARCH_CHECKS.term);
        await this.helpers.fill(this.input, HEADER_SEARCH_CHECKS.term);
        await this.page.clock.runFor(249);
        expect(requests).toEqual([]);
        await this.page.clock.runFor(1);
        const result = await response;
        expect(result.status()).toBe(200);
        const body: SearchApiBody = await result.json();
        expect(requests).toHaveLength(1);
        await this.page.clock.resume();
        for (const type of searchTypes) {
            expect(body[type].total).toBeGreaterThan(0);
            await expect(this.result(this.page, type)).toHaveCount(Math.min(SEARCH_PER_TYPE_LIMIT, body[type].total));
            if (body[type].total > SEARCH_PER_TYPE_LIMIT)
                await expect(this.globalSeeAll(this.page, type)).toHaveText(searchText.seeAll(body[type].total, type));
            else await expect(this.globalSeeAll(this.page, type)).toHaveCount(0);
        }
        expect(body.leads.total).toBeGreaterThan(SEARCH_PER_TYPE_LIMIT);
        await this.helpers.click(this.globalSeeAll(this.page, 'leads'));
        await expect(this.page).toHaveURL(url => url.pathname === '/leads' && url.searchParams.get('q') === body.term);
        await expect(this.box('leads')).toHaveValue(body.term);
        await this.searchLive(body.term);
        await this.helpers.click(this.result(this.page, 'leads').filter({ hasText: body.leads.items[0].name }));
        await expect(this.page).toHaveURL(url => url.pathname === '/leads/' + body.leads.items[0].id);
    }

    async assertEscapeAfterError() {
        await this.helpers.pressKey(this.input, 'Escape');
        await this.helpers.click(this.opener(this.page));
        await this.helpers.fill(this.input, HEADER_SEARCH_CHECKS.absent);
        await expect(this.emptyState(this.page)).toContainText(searchText.empty(HEADER_SEARCH_CHECKS.absent));
        await this.helpers.pressKey(this.input, 'Escape');
        await this.failSearchRequests();
        await this.openErrorSearchFromHeader();
        await expect(this.input).toHaveValue(SEARCH_ERROR.term);
        await this.assertEscapeFromRetryRestoresFocus();
    }

    async assertLiveTimingAndResponsiveThemes() {
        const context = await this.page.context().browser()!.newContext({
            storageState: AuthManager.getInstance().getAuthFilePath('rep'),
        });
        try {
            const page = await context.newPage();
            const search = new SearchPage(page);
            await new CrmLoginPage(page).goto();
            await new DashboardPage(page).waitForDashBoardPage();
            const samples: number[] = [];
            for (const term of HEADER_SEARCH_CHECKS.timingTerms) {
                const start = Date.now();
                await search.searchLive(term);
                samples.push(Date.now() - start);
            }
            const p95 = [...samples].sort((a, b) => a - b)[Math.ceil(samples.length * .95) - 1];
            expect(p95, '20 live typing-to-response samples ms: ' + samples.join(', ')).toBeLessThan(1000);
            await search.helpers.pressKey(search.input, 'Escape');
            for (const theme of HEADER_SEARCH_CHECKS.themes) {
                if (await page.locator('html').getAttribute('data-theme') !== theme)
                    await search.helpers.click(page.getByRole('button', { name: 'Toggle theme', exact: true }));
                await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
                for (const width of HEADER_SEARCH_CHECKS.widths) {
                    await search.helpers.setViewport({ width, height: 800 });
                    await search.searchLive(HEADER_SEARCH_CHECKS.term);
                    await expect(search.input).toHaveAccessibleName(SEARCH_LABEL);
                    await expect(search.statusRegion(page)).toContainText(/results? in/);
                    await search.helpers.pressKey(search.input, 'ArrowDown');
                    const selected = search.panel.getByRole('option', { selected: true });
                    await expect(selected).toHaveCount(1);
                    await expect(search.input).toHaveAttribute('aria-activedescendant', await selected.getAttribute('id') as string);
                    const bounds = await search.panel.boundingBox();
                    expect(bounds).not.toBeNull();
                    expect(bounds!.x).toBeGreaterThanOrEqual(0);
                    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
                    expect(bounds!.y).toBeGreaterThanOrEqual(0);
                    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(800);
                    await search.helpers.scrollToElement(selected);
                    await expect(selected).toBeInViewport();
                    await search.helpers.pressKey(search.input, 'Escape');
                }
            }
        } finally { await context.close(); }
    }
}
