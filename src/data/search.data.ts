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

export const SEARCH_ERROR = { term: 'an', heading: 'Search did not finish', response: { message: 'Controlled search failure for AIO-T79' } } as const;
