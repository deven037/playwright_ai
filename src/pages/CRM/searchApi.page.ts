import { BasePage } from '@core/BasePage';
import { expect } from '@playwright/test';
import { CrmLoginPage } from './crm.login.page';
import { DashboardPage } from './dashboard.page';
import {
    SEARCH_API, SEARCH_API_ERRORS, SEARCH_API_ROLES, SEARCH_API_TYPES, SearchApiHit, SearchApiResult, SearchApiRole,
} from '../../data/searchApi.data';

export class SearchApiPage extends BasePage {
    private readonly tokens = new Map<SearchApiRole, string>();

    async waitForPageLoad() { /* API-only page object: nothing to load */ }

    private get apiBase() {
        const base = process.env.NEWAPP_BASE_API?.replace(/\/$/, '');
        expect(base, 'NEWAPP_BASE_API must be set').toBeTruthy();
        return base!;
    }

    // Signs in through the login form in a throwaway context and returns the session token.
    private async tokenFor(role: SearchApiRole) {
        const cached = this.tokens.get(role);
        if (cached) return cached;
        const context = await this.page.context().browser()!.newContext({ ignoreHTTPSErrors: true });
        try {
            const page = await context.newPage();
            const login = new CrmLoginPage(page);
            await login.goto();
            await login.loginWithCustomCredentials(SEARCH_API_ROLES[role]);
            await new DashboardPage(page).waitForDashBoardPage();
            const token = await page.evaluate(() => sessionStorage.getItem('crm.token') ?? localStorage.getItem('crm.token'));
            expect(token, `${role} session token`).toBeTruthy();
            this.tokens.set(role, token!);
            return token!;
        } finally {
            await context.close();
        }
    }

    private async call(query: string, role?: SearchApiRole) {
        const headers = role ? { Authorization: `Bearer ${await this.tokenFor(role)}` } : undefined;
        const response = await this.page.request.get(`${this.apiBase}${SEARCH_API.path}?${query}`, { headers });
        const text = await response.text();
        return { status: response.status(), text, body: () => JSON.parse(text) as SearchApiResult };
    }

    private async search(term: string, role: SearchApiRole, extra = '') {
        const result = await this.call(`q=${encodeURIComponent(term)}${extra}`, role);
        expect(result.status, `search "${term}": ${result.text}`).toBe(200);
        return result.body();
    }

    private static hits(body: SearchApiResult): SearchApiHit[] {
        return SEARCH_API_TYPES.flatMap(type => body[type].items);
    }

    private static totals(body: SearchApiResult) {
        return SEARCH_API_TYPES.map(type => body[type].total);
    }

    async assertGroupedResultsLimitAndErrors() {
        const body = await this.search(SEARCH_API.term, 'admin');
        for (const type of SEARCH_API_TYPES) {
            const { items, total } = body[type];
            expect(Array.isArray(items), `${type} items`).toBe(true);
            expect(Number.isInteger(total), `${type} total`).toBe(true);
            expect(items.length, `${type} default limit`).toBe(Math.min(total, SEARCH_API.defaultLimit));
        }
        const limited = await this.search(SEARCH_API.term, 'admin', '&limit=1');
        for (const type of SEARCH_API_TYPES) {
            expect(limited[type].items.length, `${type} limit=1`).toBeLessThanOrEqual(1);
        }
        expect(SearchApiPage.totals(limited), 'totals unchanged by limit').toEqual(SearchApiPage.totals(body));
        for (const limit of SEARCH_API.invalidLimits) {
            const invalid = await this.call(`q=${SEARCH_API.term}&limit=${limit}`, 'admin');
            expect(invalid.status, `limit=${limit}: ${invalid.text}`).toBe(422);
            expect(invalid.text, `limit=${limit} error`).toContain('validation_error');
            expect(invalid.text, `limit=${limit} names the field`).toContain('limit');
        }
        const anonymous = await this.call(`q=${SEARCH_API.term}`);
        expect(anonymous.status, `no token: ${anonymous.text}`).toBe(401);
        expect(anonymous.text).toContain('unauthorized');
    }

    async assertNameCompanyEmailAndPhoneMatching() {
        const ids = (body: SearchApiResult) => body.leads.items.map(hit => hit.id);
        expect(ids(await this.search(SEARCH_API.seededName, 'admin')), 'case-insensitive name').toContain(SEARCH_API.seededLeadId);
        expect(ids(await this.search(SEARCH_API.seededEmailPart, 'admin')), 'email').toContain(SEARCH_API.seededLeadId);
        for (const phone of SEARCH_API.seededPhones) {
            expect(ids(await this.search(phone, 'admin')), `phone ${phone}`).toContain(SEARCH_API.seededLeadId);
        }
        for (const term of SEARCH_API.noMatchTerms) {
            expect(SearchApiPage.totals(await this.search(term, 'admin')), `totals for ${term}`).toEqual([0, 0, 0, 0]);
        }
    }

    async assertRoleVisibilityOfEmailAndPhone() {
        const results: Record<SearchApiRole, SearchApiResult> = {
            admin: await this.search(SEARCH_API.term, 'admin'),
            rep: await this.search(SEARCH_API.term, 'rep'),
            viewer: await this.search(SEARCH_API.term, 'viewer'),
        };
        expect(SearchApiPage.totals(results.rep), 'rep totals equal admin').toEqual(SearchApiPage.totals(results.admin));
        expect(SearchApiPage.totals(results.viewer), 'viewer totals equal admin').toEqual(SearchApiPage.totals(results.admin));
        for (const role of ['admin', 'rep'] as const) {
            const withDetails = SearchApiPage.hits(results[role]).filter(hit => hit.email && hit.phone);
            expect(withDetails.length, `${role} items with email and phone`).toBeGreaterThan(0);
        }
        const viewerHits = SearchApiPage.hits(results.viewer);
        expect(viewerHits.length, 'viewer items to inspect').toBeGreaterThan(0);
        expect(viewerHits.filter(hit => 'email' in hit || 'phone' in hit), 'viewer items with email/phone').toEqual([]);

        for (const term of [SEARCH_API.seededPhones[0], SEARCH_API.seededEmailPart]) {
            expect(SearchApiPage.totals(await this.search(term, 'viewer')), `viewer totals for ${term}`).toEqual([0, 0, 0, 0]);
        }
        const byName = await this.search(SEARCH_API.nameOnly.term, 'viewer');
        expect(byName.leads.total, 'viewer leads by name').toBe(SEARCH_API.nameOnly.leads);
        expect(byName.contacts.total, 'viewer contacts by name').toBe(SEARCH_API.nameOnly.contacts);
        expect(SearchApiPage.hits(byName).filter(hit => 'email' in hit || 'phone' in hit), 'viewer name hits with email/phone').toEqual([]);
    }

    async assertInvalidTermsReturnDefinedErrors() {
        const { tooShort, missing, blank, tooLong } = SEARCH_API_ERRORS;
        const cases = [
            { label: 'one character', query: `q=${tooShort.term}`, message: tooShort.message },
            { label: 'no q', query: '', message: missing.message },
            { label: 'blank q', query: `q=${encodeURIComponent(blank.term)}`, message: blank.message },
            { label: '101 characters', query: `q=${tooLong.term}`, message: tooLong.message },
        ];
        for (const { label, query, message } of cases) {
            const result = await this.call(query, 'admin');
            expect(result.status, `${label}: ${result.text}`).toBe(422);
            expect(result.text, `${label} error code`).toContain('validation_error');
            expect(result.text, `${label} message`).toContain(message);
        }
    }

    async assertP95UnderLimit() {
        const timings: number[] = [];
        for (let i = 0; i < SEARCH_API.timingCalls; i++) {
            const started = performance.now();
            const result = await this.call(`q=${SEARCH_API.term}`, 'admin');
            timings.push(performance.now() - started);
            expect(result.status, `call ${i + 1}: ${result.text}`).toBe(200);
        }
        const sorted = [...timings].sort((a, b) => a - b);
        const p95 = sorted[Math.ceil(0.95 * sorted.length) - 1];
        expect(p95, `p95 of ${sorted.length} calls (ms)`).toBeLessThan(SEARCH_API.timingLimitMs);
    }
}
