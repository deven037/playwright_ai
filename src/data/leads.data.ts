// AIO-149 / AIO-T27: Viewer lacks permission to see lead contact fields (AIO-61 AC4).
// Seeded demo account from the CRM README; its password is read from NEWAPP_PASSWORD like every other login.
export const VIEWER_EMAIL = 'viewer@crm.com';
export const HIDDEN_LEAD_COLUMNS = ['Email', 'Phone'] as const;
export const EMAIL_VALUE_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// Whole-cell match: a phone cell is only digits, spaces, dashes and an optional +, so names like "Lead_1794384305536" don't match.
export const PHONE_VALUE_PATTERN = /^\+?\d[\d\s-]{6,}\d$/;

// AIO-125 / AIO-T101: 75 seeded leads, 10 per page (AC4 reach every page, AC5 filter-empty state).
export const SEEDED_LEAD_COUNT = 75;
export const LEADS_PAGE_SIZE = 10;
export const LEADS_TOTAL_PAGES = 8;
export const LEADS_LAST_PAGE_ROWS = 5;
export const NO_MATCH_SEARCH_TEXT = 'zzzqqq';
export const NO_MATCH_MESSAGE = 'No leads match the current filters.';
