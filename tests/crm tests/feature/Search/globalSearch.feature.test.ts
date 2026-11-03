import { expect, test } from "@fixtures/CrmFixtures";
import type { Page } from '@playwright/test';

const types = ['leads', 'contacts', 'accounts', 'deals'] as const;
const opener = (page: Page) => page.getByRole('button', { name: /Search leads, contacts, accounts/ });
const input = (page: Page) => page.getByTestId('command-input');
const empty = (term: string) => ({
    term, ...Object.fromEntries(types.map(type => [type, { items: [], total: 0 }]))
});
const result = (term: string) => ({
    ...empty(term), leads: { items: [{ id: 'controlled-lead', name: term, subtitle: 'Controlled response' }], total: 1 }
});
const fulfill = (route: any, body: unknown) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });

// Live server assertions below are separate from controlled UI transport scenarios.
// AC13 p95 is intentionally pending owner-verified latency/configuration identity (message #441).
test.describe('Global search @regression', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage }) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForDashBoardPage();
    });

    test('Known staging records: totals, See all filters, exclusions and Admin/Rep/Viewer permissions', async ({
        page, crmLoginPage, dashboardPage
    }) => {
        test.setTimeout(180000);
        const base = process.env.NEWAPP_BASE_API?.replace(/\/$/, '');
        expect(base, 'NEWAPP_BASE_API must identify staging').toBeTruthy();
        expect(new URL(base!).hostname).toBe('crm-practice-api.onrender.com');
        const token = await page.evaluate(() => sessionStorage.getItem('crm.token') ?? localStorage.getItem('crm.token'));
        expect(token).toBeTruthy();
        const adminHeaders = { Authorization: `Bearer ${token}` };
        const created: { type: string; id: string }[] = [];
        const prefix = `qa204${Date.now()}${test.info().workerIndex}`;
        const phone = `555${Date.now()}`;
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
            const records: Record<string, any[]> = Object.fromEntries(types.map(type => [type, []]));
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

            for (const role of ['admin', 'rep', 'viewer']) {
                if (role !== 'admin') {
                    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
                    await crmLoginPage.goto();
                    await crmLoginPage.loginWithCustomCredentials(`${role}@crm.com`);
                    await dashboardPage.waitForDashBoardPage();
                }
                const roleToken = await page.evaluate(() => sessionStorage.getItem('crm.token') ?? localStorage.getItem('crm.token'));
                const headers = { Authorization: `Bearer ${roleToken}` };
                const body = await search(prefix, headers);
                for (const type of types) {
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
                for (const term of [email, phone, `(${phone.slice(0, 3)}) ${phone.slice(3, 8)}-${phone.slice(8)}`]) {
                    const matched = await search(term, headers);
                    for (const type of types) {
                        const expected = role === 'viewer' || type === 'deals' || (type === 'accounts' && term === email) ? 0 : 4;
                        expect(matched[type].total, `${role} ${type} matching ${term}`).toBe(expected);
                        if (expected === 0) expect(matched[type].items).toEqual([]);
                    }
                }
                await opener(page).click();
                await input(page).fill(prefix);
                for (const type of types) {
                    await expect(page.getByTestId(`search-result-${type}`)).toHaveCount(3);
                    await expect(page.getByTestId(`search-see-all-${type}`)).toHaveText(`See all 4 ${type}`);
                }
                if (role === 'viewer') {
                    const panel = page.getByTestId('command-bar');
                    await expect(panel).not.toContainText(email);
                    await expect(panel).not.toContainText(phone);
                }
                await page.keyboard.press('Escape');
            }

            // Verify navigation AND the destination filter, for every module.
            for (const type of types) {
                await opener(page).click();
                await input(page).fill(prefix);
                await page.getByTestId(`search-see-all-${type}`).click();
                await expect(page).toHaveURL(url => url.pathname === `/${type}` && url.searchParams.get('q') === prefix);
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
            await opener(page).click();
            await input(page).fill(records.leads[0].name);
            await expect(page.getByRole('group')).toHaveCount(1);
            await expect(page.getByRole('group', { name: 'Leads', exact: true })).toBeVisible();
            await page.getByTestId('search-result-leads').click();
            await expect(page).toHaveURL(new RegExp(`/leads/${records.leads[0].id}$`));
        } finally {
            // Keep the Admin token for cleanup even after role changes; attempt every deletion.
            const failures: string[] = [];
            for (const row of [...created].reverse()) {
                const response = await page.request.delete(`${base}/api/${row.type}/${row.id}`, { headers: adminHeaders });
                if (response.status() !== 204) failures.push(`${row.type}/${row.id}: HTTP ${response.status()} ${await response.text()}`);
            }
            expect(failures, 'Isolated staging record cleanup').toEqual([]);
        }
    });

    test('Minimum and 250 ms debounce; keyboard selection, announcements and focus', async ({ page }) => {
        const requests: string[] = [];
        await page.route('**/api/search?**', async route => {
            const term = new URL(route.request().url()).searchParams.get('q')!;
            requests.push(term);
            await fulfill(route, result(term));
        });
        await opener(page).focus();
        await page.keyboard.press('Control+k');
        await expect(input(page)).toBeFocused();
        await page.clock.install();
        await page.clock.pauseAt(new Date());
        await input(page).fill('q');
        await page.clock.runFor(500);
        expect(requests).toEqual([]);
        await input(page).fill('qa');
        await page.clock.runFor(200);
        expect(requests).toEqual([]);
        await input(page).fill('qab');
        await page.clock.runFor(249);
        expect(requests).toEqual([]);
        await page.clock.runFor(1);
        await expect(page.getByTestId('search-result-leads')).toHaveText('qabControlled response');
        expect(requests).toEqual(['qab']);
        await expect(page.getByTestId('command-bar').getByRole('status')).toContainText('1 result in 1 type');
        await input(page).press('ArrowDown');
        await expect(page.getByTestId('search-result-leads')).toHaveAttribute('aria-selected', 'true');
        await expect(input(page)).toHaveAttribute('aria-activedescendant', await page.getByTestId('search-result-leads').getAttribute('id') as string);
        await input(page).press('ArrowUp');
        await expect(page.getByTestId('search-result-leads')).toHaveAttribute('aria-selected', 'true');
        await input(page).press('Escape');
        await expect(page.getByTestId('command-bar')).toHaveCount(0);
        await expect(opener(page)).toBeFocused();
        await page.clock.resume();
        await opener(page).click();
        await input(page).fill('qa');
        await expect(page.getByTestId('search-result-leads')).toBeVisible();
        await input(page).press('ArrowDown');
        await input(page).press('Enter');
        await expect(page).toHaveURL(/\/leads\/controlled-lead$/);
    });

    test('Controlled loading, error, retry of retained term and empty state', async ({ page }) => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const terms: string[] = [];
        await page.route('**/api/search?**', async route => {
            const term = new URL(route.request().url()).searchParams.get('q')!;
            terms.push(term);
            if (terms.length === 1) {
                await gate;
                await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
            } else await fulfill(route, empty(term));
        });
        await opener(page).click();
        await input(page).fill('no-match');
        await expect(page.getByTestId('search-loading')).toBeVisible();
        await expect(input(page)).toHaveAttribute('aria-busy', 'true');
        release();
        await expect(page.getByRole('alert')).toContainText('Search did not finish');
        await page.getByRole('button', { name: 'Try again', exact: true }).click();
        await expect(page.getByTestId('search-empty')).toContainText('No matches for "no-match"');
        expect(terms).toEqual(['no-match', 'no-match']);
        await expect(input(page)).toHaveValue('no-match');
        await expect(page.getByRole('group')).toHaveCount(0);
    });

    test('An older delayed response cannot replace a newer result', async ({ page }) => {
        let release!: () => void;
        let completed!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const finished = new Promise<void>(resolve => { completed = resolve; });
        await page.route('**/api/search?**', async route => {
            const term = new URL(route.request().url()).searchParams.get('q')!;
            if (term === 'older') {
                await gate;
                await fulfill(route, result(term));
                completed();
            } else await fulfill(route, result(term));
        });
        await opener(page).click();
        await input(page).fill('older');
        await expect(page.getByTestId('search-loading')).toBeVisible();
        await input(page).fill('newer');
        await expect(page.getByTestId('search-result-leads')).toContainText('newer');
        release();
        await finished;
        // Flush the browser fetch/React work before checking retained results.
        await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
        await expect(page.getByTestId('search-result-leads')).toContainText('newer');
        await expect(page.getByTestId('command-bar')).not.toContainText('older');
    });
});
