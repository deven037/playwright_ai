export const SEARCH_LABEL = 'Search leads, contacts, accounts and deals';
export const SEARCH_TERMS = { first: 'quinnalpha', second: 'quinnbeta', absent: 'quinnmissing' } as const;
export const SEARCH_MODULES = ['leads', 'contacts', 'accounts'] as const;
export type SearchModule = typeof SEARCH_MODULES[number];

// Fixture size: 24 records per module, 12 per search term; leads paginate at 10 per page.
export const SEARCH_MATCH_COUNT = 12;
export const LEADS_PAGE_SIZE = 10;
export const seeAllLabel = (module: SearchModule) => `See all ${SEARCH_MATCH_COUNT} ${module}`;
export const LEADS_PAGINATION_LABEL = `${SEARCH_MATCH_COUNT} lead(s) · page 1 of ${Math.ceil(SEARCH_MATCH_COUNT / LEADS_PAGE_SIZE)}`;

// Browser-local GET fixtures: no shared staging records are created or modified.
export const SEARCH_RECORDS = Object.fromEntries(SEARCH_MODULES.map(module => [module,
    Array.from({ length: SEARCH_MATCH_COUNT * 2 }, (_, i) => ({
        id: `aio246-${module}-${i}`,
        name: `${i < SEARCH_MATCH_COUNT ? SEARCH_TERMS.first : SEARCH_TERMS.second} ${i}`,
        company: 'QA Company', email: `qa${i}@example.test`, phone: '1234567890',
        status: 'New', source: 'Website', value: 100, ownerId: 'user-admin',
        createdAt: '2026-11-01T00:00:00.000Z', industry: 'Technology',
        employees: 1, revenue: 100, website: '', accountId: '', title: 'QA',
        tags: [], avatar: null, notes: [], files: [],
    }))
])) as Record<SearchModule, Array<Record<string, any>>>;

export function searchResponse(term: string) {
    return { term, ...Object.fromEntries([...SEARCH_MODULES, 'deals'].map(module => {
        const rows = module === 'deals' ? [] : SEARCH_RECORDS[module as SearchModule].filter(row => row.name.includes(term));
        return [module, { total: rows.length, items: rows.slice(0, 3).map(row => ({
            id: row.id, name: row.name, subtitle: 'QA fixture',
        })) }];
    })) };
}

// AIO-202 (Search API) role checks against the live staging API; demo users from the CRM README.
export const SEARCH_ROLE_EMAILS = { admin: 'admin@crm.com', rep: 'rep@crm.com', viewer: 'viewer@crm.com' } as const;
export type SearchRole = keyof typeof SEARCH_ROLE_EMAILS;
export const SEARCH_API_GROUPS = ['leads', 'contacts', 'accounts', 'deals'] as const;
export const SEARCH_PER_TYPE_LIMIT = 3;
export const SEARCH_GROUPING_TERM = 'an';
export const SEARCH_LIVE_PATHS = { search: '/api/search' } as const;

// Seeded lead "Aarav Kapoor" (lead-1, status New) from the CRM's deterministic seed data.
export const SEARCH_SEEDED_LEAD = { id: 'lead-1', email: 'aarav.kapoor@example.com', phoneDigits: '919864959172' } as const;

export interface SearchHitData { id: string; name: string; subtitle: string; email?: string; phone?: string }
export interface SearchGroupData { items: SearchHitData[]; total: number }
export type SearchApiBody = { term: string } & Record<typeof SEARCH_API_GROUPS[number], SearchGroupData>;

// Phone written with spaces, dashes and brackets must match the same digits (AIO-202 AC2).
export const formatPhoneWithSeparators = (digits: string) =>
    `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;

export const LIST_LOAD_TIMEOUT = 30_000;
export const searchTypes =['leads', 'contacts', 'accounts', 'deals'] as const;
export const searchRoles = ['admin', 'rep', 'viewer'] as const;
export const searchText = {
    subtitle: 'Controlled response',
    controlledId: 'controlled-lead',
    error: 'Search did not finish',
    announcement: '1 result in 1 type',
    retry: 'Try again',
    leadsOneMatch: 'Leads 1 match',
    empty: (term: string) => `No matches for "${term}"`,
    seeAll: (total: number, type: string) => `See all ${total} ${type}`,
    filteredBy: (term: string) => `Filtered by "${term}" · Clear`,
};
export const searchTerms = { minimum: 'q', initial: 'qa', debounced: 'qab', empty: 'no-match', older: 'older', newer: 'newer' };
export const emptySearchResponse = (term: string) => ({
    term, ...Object.fromEntries(searchTypes.map(type => [type, { items: [], total: 0 }]))
});
export const controlledSearchResponse = (term: string) => ({
    ...emptySearchResponse(term),
    leads: { items: [{ id: searchText.controlledId, name: term, subtitle: searchText.subtitle }], total: 1 }
});

/** Staging fixture payload builders for the known-records scenario (all names carry the per-run prefix). */
export const searchFixtures = {
    account: (prefix: string, i: number, ownerId: string, phone: string) =>
        ({ name: `${prefix} Account ${i}`, ownerId, phone }),
    lead: (prefix: string, i: number, ownerId: string, email: string, phone: string) =>
        ({ name: `${prefix} Lead ${i}`, company: `${prefix} Company`, email, phone, ownerId }),
    contact: (prefix: string, i: number, accountId: string, email: string, phone: string) =>
        ({ name: `${prefix} Contact ${i}`, accountId, email, phone }),
    deal: (prefix: string, i: number, accountId: string, ownerId: string) =>
        ({ name: `${prefix} Deal ${i}`, accountId, ownerId }),
    convertedLead: (prefix: string, ownerId: string, email: string, phone: string) =>
        ({ name: `${prefix} Converted`, email, phone, ownerId, status: 'Converted' }),
    deletedLead: (prefix: string, ownerId: string, email: string, phone: string) =>
        ({ name: `${prefix} Deleted`, email, phone, ownerId }),
    unrelatedDeal: (accountId: string, ownerId: string) =>
        ({ name: `Unrelated ${Date.now()}`, accountId, ownerId }),
};
export const searchScenarioNames = [
    "Known staging records: totals, See all filters, exclusions and Admin/Rep/Viewer permissions",
    "Minimum and 250 ms debounce; keyboard selection, announcements and focus",
    "Controlled loading, error, retry of retained term and empty state",
    "An older delayed response cannot replace a newer result"
] as const;

export const SEARCH_ERROR = { term: 'an', heading: 'Search did not finish', response: { message: 'Controlled search failure for AIO-T79' } } as const;
