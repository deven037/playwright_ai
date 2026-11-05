export const searchTypes = ['leads', 'contacts', 'accounts', 'deals'] as const;
export const searchRoles = ['admin', 'rep', 'viewer'] as const;
export const searchText = {
    subtitle: 'Controlled response',
    controlledId: 'controlled-lead',
    error: 'Search did not finish',
    announcement: '1 result in 1 type',
    empty: (term: string) => `No matches for "${term}"`,
    seeAll: (total: number, type: string) => `See all ${total} ${type}`,
};
export const searchTerms = { minimum: 'q', initial: 'qa', debounced: 'qab', empty: 'no-match', older: 'older', newer: 'newer' };
export const emptySearchResponse = (term: string) => ({
    term, ...Object.fromEntries(searchTypes.map(type => [type, { items: [], total: 0 }]))
});
export const controlledSearchResponse = (term: string) => ({
    ...emptySearchResponse(term),
    leads: { items: [{ id: searchText.controlledId, name: term, subtitle: searchText.subtitle }], total: 1 }
});
export const searchScenarioNames = [
    "Known staging records: totals, See all filters, exclusions and Admin/Rep/Viewer permissions",
    "Minimum and 250 ms debounce; keyboard selection, announcements and focus",
    "Controlled loading, error, retry of retained term and empty state",
    "An older delayed response cannot replace a newer result"
] as const;
