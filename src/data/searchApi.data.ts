// AIO-202 Search API cases (AIO-T83 to AIO-T87) against the live staging API; demo users from the CRM README.
export const SEARCH_API_ROLES = { admin: 'admin@crm.com', rep: 'rep@crm.com', viewer: 'viewer@crm.com' } as const;
export type SearchApiRole = keyof typeof SEARCH_API_ROLES;
export const SEARCH_API_TYPES = ['leads', 'contacts', 'accounts', 'deals'] as const;

export interface SearchApiHit { id: string; name: string; subtitle?: string; email?: string; phone?: string }
export interface SearchApiGroup { items: SearchApiHit[]; total: number }
export type SearchApiResult = { term: string } & Record<typeof SEARCH_API_TYPES[number], SearchApiGroup>;

export const SEARCH_API = {
    path: '/api/search',
    term: 'an',
    defaultLimit: 3,
    invalidLimits: ['11', '0', 'abc'],
    seededLeadId: 'lead-1',
    seededEmailPart: 'aarav.kapoor@example',
    seededPhones: ['98649 59172', '98649-59172', '(98649) 59172', '9864959172', '+91 98649 59172'],
    seededName: 'AARAV',
    companyOnly: { term: 'Aurora Analytics', expectedLead: { id: 'lead-1', name: 'Aarav Kapoor', subtitle: 'Aurora Analytics' } },
    nameOnly: { term: 'aarav', leads: 4, contacts: 2 },
    noMatchTerms: ['zzzzqq', '%\\_'],
    timingCalls: 20,
    timingLimitMs: 1000,
} as const;

export const SEARCH_API_ERRORS = {
    tooShort: { term: 'a', message: 'Search term must be at least 2 characters.' },
    missing: { message: 'Enter a search term.' },
    blank: { term: '   ', message: 'at least 2 characters' },
    tooLong: { term: 'x'.repeat(101), message: 'Search term must be 100 characters or fewer.' },
} as const;
