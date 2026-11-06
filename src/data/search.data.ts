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

// AIO-211: live staging search (API-derived counts), seeded demo data.
export type SearchType = 'leads' | 'contacts' | 'accounts' | 'deals';
export const SEARCH_TYPES: readonly SearchType[] = ['leads', 'contacts', 'accounts', 'deals'];
export const SEARCH_ROWS_PER_TYPE = 3;
export const COUNT_TERM = 'ver';
export const COUNT_TOTALS: Record<SearchType, number> = { leads: 14, contacts: 5, accounts: 2, deals: 2 };
export const COUNT_FOOTER = '23 results in 4 types';
export const SEE_ALL_LABELS = { leads: 'See all 14 leads', contacts: 'See all 5 contacts' } as const;
export const SEARCH_TYPE_HEADINGS: Record<SearchType, string> = { leads: 'Leads', contacts: 'Contacts', accounts: 'Accounts', deals: 'Deals' };
export const groupName = (type: SearchType, total: number) =>
    `${SEARCH_TYPE_HEADINGS[type]} ${total === 1 ? '1 match' : `${total} matches`}`;
export const STAGE_ONLY_TERM = 'won';
export const SHORT_TERM = 'v';
export const SHORT_TERM_HINT = 'Type 2 or more characters to search leads, contacts, accounts and deals.';
export const NO_MATCH_TERM = 'acme';
export const noMatchesHeading = (term: string) => `No matches for "${term}"`;
export const HIDDEN_CONTACT_TERM = 'example.com';
export const VIEWER_EMAIL = 'viewer@crm.com';
export const REP_EMAIL = 'rep@crm.com';
export const VIEWPORTS = {
    phone: { width: 375, height: 800 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1440, height: 900 },
} as const;
export const CLEAR_BUTTON_MIN_PX = 44;
export const FIRST_RESULT_URL = /\/leads\/lead-3$/;
