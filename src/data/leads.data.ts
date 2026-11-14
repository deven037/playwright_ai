// AIO-149 / AIO-T27: Viewer lacks permission to see lead contact fields (AIO-61 AC4).
// Seeded demo account from the CRM README; its password is read from NEWAPP_PASSWORD like every other login.
export const VIEWER_EMAIL = 'viewer@crm.com';
export const HIDDEN_LEAD_COLUMNS = ['Email', 'Phone'] as const;
export const EMAIL_VALUE_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// Whole-cell match: a phone cell is only digits, spaces, dashes and an optional +, so names like "Lead_1794384305536" don't match.
export const PHONE_VALUE_PATTERN = /^\+?\d[\d\s-]{6,}\d$/;

// AIO-125 / AIO-T101: 75 seeded leads, 10 per page (AC4 reach every page, AC5 filter-empty state).
// Other specs add leads on shared staging, so the total is read from the page and must be at least the seed.
export const SEEDED_LEAD_COUNT = 75;
export const LEADS_PAGE_SIZE = 10;
export const PAGE_BUTTON_WINDOW_SIZE = 7;
export const NO_MATCH_SEARCH_TEXT = 'zzz-no-such-lead';
export const NO_MATCH_MESSAGE = 'No leads match the current filters.';

export const LEAD_FORM_ACCESSIBILITY = {
    labels: [
        'Full name *', 'Company', 'Email *', 'Phone', 'Status', 'Source',
        'Interested product', 'Campaign', 'Owner', 'Estimated value ($)',
    ],
    fullName: 'AIO-T204 label regression',
    invalidEmail: 'bad',
    emailError: 'Enter a valid email.',
    statuses: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'],
} as const;

// AIO-395 / AIO-T203: shared expected status and block message.
export const CONVERTED_LEAD_STATUS = 'Converted';
export const NON_CONVERTED_LEAD_STATUS = 'New';
export const ALREADY_CONVERTED_MESSAGE = 'This lead is already converted.';
