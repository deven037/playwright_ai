import { expect, Page, Route, BrowserContext } from '@playwright/test';
import { BasePage } from '@core/BasePage';
import { Helpers } from '../../utils/Helpers';
import { CrmLoginPage } from './crm.login.page';
import { DashboardPage } from './dashboard.page';
import { searchTypes, searchRoles, searchText, searchTerms, emptySearchResponse, controlledSearchResponse } from '../../data/search.data';

export class SearchPage extends BasePage {
    async waitForPageLoad() { await this.helpers.assertVisible(this.opener(this.page)); }

    private opener(page: Page) { return page.getByRole('button', { name: /Search leads, contacts, accounts/ }); }
    private input(page: Page) { return page.getByTestId('command-input'); }
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
                const account = await create('accounts', { name: `${prefix} Account ${i}`, ownerId, phone });
                records.accounts.push(account);
                records.leads.push(await create('leads', {
                    name: `${prefix} Lead ${i}`, company: `${prefix} Company`, email, phone, ownerId
                }));
                records.contacts.push(await create('contacts', {
                    name: `${prefix} Contact ${i}`, accountId: account.id, email, phone
                }));
                records.deals.push(await create('deals', {
                    name: `${prefix} Deal ${i}`, accountId: account.id, ownerId
                }));
            }
            await create('leads', { name: `${prefix} Converted`, email, phone, ownerId, status: 'Converted' });
            const deleted = await create('leads', { name: `${prefix} Deleted`, email, phone, ownerId });
            await api(`leads/${deleted.id}`, 'DELETE');
            created.splice(created.findIndex(row => row.id === deleted.id), 1);
            // Related account matches prefix, but the Deal name does not.
            await create('deals', { name: `Unrelated ${Date.now()}`, accountId: records.accounts[0].id, ownerId });

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
                await helpers.fill(this.input(page), prefix);
                for (const type of searchTypes) {
                    await expect(page.getByTestId(`search-result-${type}`)).toHaveCount(3);
                    await expect(page.getByTestId(`search-see-all-${type}`)).toHaveText(searchText.seeAll(4, type));
                }
                if (role === 'viewer') {
                    const panel = page.getByTestId('command-bar');
                    await expect(panel).not.toContainText(email);
                    await expect(panel).not.toContainText(phone);
                }
                await page.keyboard.press('Escape');
            }

            // Verify navigation AND the destination filter, for every module.
            for (const type of searchTypes) {
                await helpers.click(this.opener(page));
                await helpers.fill(this.input(page), prefix);
                await helpers.click(page.getByTestId(`search-see-all-${type}`));
                await expect(page).toHaveURL(url => url.pathname === `/${type}` && url.searchParams.get(searchTerms.minimum) === prefix);
                const module = page.getByTestId(`${type}-page`);
                await expect(module).toBeVisible();
                if (type === 'deals') {
                    await expect(module.getByRole('button', { name: `Filtered by "${prefix}" · Clear`, exact: true })).toBeVisible();
                    await expect(module.locator('.kanban-card-title')).toHaveCount(4);
                    expect((await module.locator('.kanban-card-title').allTextContents()).sort()).toEqual(records.deals.map(row => row.name).sort());
                } else {
                    await expect(module.getByRole('searchbox')).toHaveValue(prefix);
                    for (const row of records[type]) await expect(module.getByText(row.name, { exact: true })).toBeVisible();
                }
            }
            await helpers.click(this.opener(page));
            await helpers.fill(this.input(page), records.leads[0].name);
            await expect(page.getByRole('group')).toHaveCount(1);
            await expect(page.getByRole('group', { name: 'Leads 1 match', exact: true })).toBeVisible();
            await helpers.click(page.getByTestId('search-result-leads'));
            await expect(page).toHaveURL(new RegExp(`/leads/${records.leads[0].id}$`));
        } finally {
            // Keep the Admin token for cleanup even after role changes; attempt every deletion.
            const failures: string[] = [];
            for (const row of [...created].reverse()) {
                const response = await page.request.delete(`${base}/api/${row.type}/${row.id}`, { headers: adminHeaders });
                if (response.status() !== 204) failures.push(`${row.type}/${row.id}: HTTP ${response.status()} ${await response.text()}`);
            }
            await Promise.all(roleContexts.map(context => context.close()));
            expect(failures, 'Isolated staging record cleanup').toEqual([]);
        }
    }

    async assertMinimumDebounceAndKeyboard() {
        const page = this.page;
        const helpers = this.helpers;
        const requests = await this.stubSearchResults();
        await this.opener(page).focus();
        await page.keyboard.press('Control+k');
        await expect(this.input(page)).toBeFocused();
        await page.clock.install();
        await page.clock.pauseAt(new Date());
        await helpers.fill(this.input(page), searchTerms.minimum);
        await page.clock.runFor(500);
        expect(requests).toEqual([]);
        await helpers.fill(this.input(page), searchTerms.initial);
        await page.clock.runFor(200);
        expect(requests).toEqual([]);
        await helpers.fill(this.input(page), searchTerms.debounced);
        await page.clock.runFor(249);
        expect(requests).toEqual([]);
        await page.clock.runFor(1);
        await expect(page.getByTestId('search-result-leads')).toHaveText(searchTerms.debounced + searchText.subtitle);
        expect(requests).toEqual([searchTerms.debounced]);
        await expect(page.getByTestId('command-bar').getByRole('status')).toContainText(searchText.announcement);
        await this.input(page).press('ArrowDown');
        await expect(page.getByTestId('search-result-leads')).toHaveAttribute('aria-selected', 'true');
        await expect(this.input(page)).toHaveAttribute('aria-activedescendant', await page.getByTestId('search-result-leads').getAttribute('id') as string);
        await this.input(page).press('ArrowUp');
        await expect(page.getByTestId('search-result-leads')).toHaveAttribute('aria-selected', 'true');
        await this.input(page).press('Escape');
        await expect(page.getByTestId('command-bar')).toHaveCount(0);
        await expect(this.opener(page)).toBeFocused();
        await page.clock.resume();
        await helpers.click(this.opener(page));
        await helpers.fill(this.input(page), searchTerms.initial);
        await expect(page.getByTestId('search-result-leads')).toBeVisible();
        await this.input(page).press('ArrowDown');
        await this.input(page).press('Enter');
        await expect(page).toHaveURL(new RegExp(`/leads/${searchText.controlledId}        const requests: string[] = [];
        await page.route('**/api/search?**', async route => {
            const term = new URL(route.request().url()).searchParams.get(searchTerms.minimum)!;
            requests.push(term);
            await this.fulfill(route, controlledSearchResponse(term));
        });
        await this.opener(page).focus();
        await page.keyboard.press('Control+k');
        await expect(this.input(page)).toBeFocused();
        await page.clock.install();
        await page.clock.pauseAt(new Date());
        await helpers.fill(this.input(page), searchTerms.minimum);
        await page.clock.runFor(500);
        expect(requests).toEqual([]);
        await helpers.fill(this.input(page), searchTerms.initial);
        await page.clock.runFor(200);
        expect(requests).toEqual([]);
        await helpers.fill(this.input(page), searchTerms.debounced);
        await page.clock.runFor(249);
        expect(requests).toEqual([]);
        await page.clock.runFor(1);
        await expect(page.getByTestId('search-result-leads')).toHaveText(searchTerms.debounced + searchText.subtitle);
        expect(requests).toEqual([searchTerms.debounced]);
        await expect(page.getByTestId('command-bar').getByRole('status')).toContainText(searchText.announcement);
        await this.input(page).press('ArrowDown');
        await expect(page.getByTestId('search-result-leads')).toHaveAttribute('aria-selected', 'true');
        await expect(this.input(page)).toHaveAttribute('aria-activedescendant', await page.getByTestId('search-result-leads').getAttribute('id') as string);
        await this.input(page).press('ArrowUp');
        await expect(page.getByTestId('search-result-leads')).toHaveAttribute('aria-selected', 'true');
        await this.input(page).press('Escape');
        await expect(page.getByTestId('command-bar')).toHaveCount(0);
        await expect(this.opener(page)).toBeFocused();
        await page.clock.resume();
        await helpers.click(this.opener(page));
        await helpers.fill(this.input(page), searchTerms.initial);
        await expect(page.getByTestId('search-result-leads')).toBeVisible();
        await this.input(page).press('ArrowDown');
        await this.input(page).press('Enter');
        await expect(page).toHaveURL());
    }

    async assertLoadingErrorRetryAndEmpty() {
        const page = this.page;
        const helpers = this.helpers;
        const { terms, release } = await this.failFirstSearchRequest();
        await helpers.click(this.opener(page));
        await helpers.fill(this.input(page), searchTerms.empty);
        await expect(page.getByTestId('search-loading')).toBeVisible();
        await expect(this.input(page)).toHaveAttribute('aria-busy', 'true');
        release();
        await expect(page.getByRole('alert')).toContainText(searchText.error);
        await helpers.click(page.getByRole('button', { name: 'Try again', exact: true }));
        await expect(page.getByTestId('search-empty')).toContainText(searchText.empty(searchTerms.empty));
        expect(terms).toEqual([searchTerms.empty, searchTerms.empty]);
        await expect(this.input(page)).toHaveValue(searchTerms.empty);
        await expect(page.getByRole('group')).toHaveCount(0);
    }

    async assertNewerResponseIsRetained() {
        const page = this.page;
        const helpers = this.helpers;
        const { release, finished } = await this.delayOlderResponse();
        await helpers.click(this.opener(page));
        await helpers.fill(this.input(page), searchTerms.older);
        await expect(page.getByTestId('search-loading')).toBeVisible();
        await helpers.fill(this.input(page), searchTerms.newer);
        await expect(page.getByTestId('search-result-leads')).toContainText(searchTerms.newer);
        release();
        await finished;
        // Flush the browser fetch/React work before checking retained results.
        await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
        await expect(page.getByTestId('search-result-leads')).toContainText(searchTerms.newer);
        await expect(page.getByTestId('command-bar')).not.toContainText(searchTerms.older);
    }
}
