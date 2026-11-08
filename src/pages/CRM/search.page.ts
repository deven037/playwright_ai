import { Page, BrowserContext, Locator } from '@playwright/test';
import { Helpers } from '../../utils/Helpers';
import { CrmLoginPage } from './crm.login.page';
import { DashboardPage } from './dashboard.page';
import { searchTypes, searchRoles, searchText, searchTerms, searchFixtures, emptySearchResponse, controlledSearchResponse } from '../../data/search.data';

import { BasePage } from '@core/BasePage';
import { expect, Route } from '@playwright/test';
import {
    LEADS_PAGE_SIZE, LEADS_PAGINATION_LABEL, SEARCH_LABEL, SEARCH_MATCH_COUNT, SEARCH_MODULES, SEARCH_RECORDS,
    SEARCH_TERMS, SearchModule, searchResponse, seeAllLabel,
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
    private groups(page: Page) { return page.getByRole('group'); }
    private namedGroup(page: Page, name: string) { return page.getByRole('group', { name, exact: true }); }
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
            } else await this.fulfill(route, controlledSearchResponse(term));
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
                    const context = await this.page.context().browser()!.newContext();
                    roleContexts.push(context);
                    page = await context.newPage();
                    helpers = new Helpers(page);
                    const login = new CrmLoginPage(page);
                    await login.goto();
                    await login.loginWithCustomCredentials(`${role}@crm.com`);
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
                for (const term of [email, phone, `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`]) {
                    const matched = await search(term, headers);
                    for (const type of searchTypes) {
                        const expected = role === 'viewer' || type === 'deals' || (type === 'accounts' && term === email) ? 0 : 4;
                        expect(matched[type].total, `${role} ${type} matching ${term}`).toBe(expected);
                        if (expected === 0) expect(matched[type].items).toEqual([]);
                    }
                }
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
                await helpers.click(this.opener(page));
                await helpers.fill(this.globalInput(page), prefix);
                await helpers.click(this.globalSeeAll(page, type));
                await expect(page).toHaveURL(url => url.pathname === `/${type}` && url.searchParams.get(searchTerms.minimum) === prefix);
                const module = this.modulePage(page, type);
                await expect(module).toBeVisible();
                if (type === 'deals') {
                    await expect(this.filterChip(module, searchText.filteredBy(prefix))).toBeVisible();
                    await expect(this.kanbanTitles(module)).toHaveCount(4);
                    expect((await this.kanbanTitles(module).allTextContents()).sort()).toEqual(records.deals.map(row => row.name).sort());
                } else {
                    await expect(this.searchbox(module)).toHaveValue(prefix);
                    for (const row of records[type]) await expect(this.rowText(module, row.name)).toBeVisible();
                }
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
                        if (response.status() !== 204) failures.push(`${row.type}/${row.id}: HTTP ${response.status()} ${await response.text()}`);
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
        await expect(this.result(page, 'leads')).toContainText(searchTerms.newer);
        release();
        await finished;
        // Flush the browser fetch/React work before checking retained results.
        await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
        await expect(this.result(page, 'leads')).toContainText(searchTerms.newer);
        await expect(this.globalPanel(page)).not.toContainText(searchTerms.older);
    }
}
