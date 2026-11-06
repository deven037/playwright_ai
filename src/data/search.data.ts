export const searchTypes = ['leads', 'contacts', 'accounts', 'deals'] as const;
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
