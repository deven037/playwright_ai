export const CONVERTED_SEARCH = {
    prefix: 'AioT100',
    phone: '9876543210',
    newStatus: 'New',
    convertedStatus: 'Converted',
    noMatches: 'No leads match the current filters.',
} as const;

export function convertedSearchLead() {
    const suffix = crypto.randomUUID().replace(/-/g, '');
    return {
        name: `${CONVERTED_SEARCH.prefix}${suffix}`,
        company: `Company${suffix}`,
        email: `qa${suffix}@example.test`,
    };
}
