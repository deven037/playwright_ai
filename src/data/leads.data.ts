// AIO-149 / AIO-T27: Viewer lacks permission to see lead contact fields (AIO-61 AC4).
// Seeded demo account from the CRM README; its password is read from NEWAPP_PASSWORD like every other login.
export const VIEWER_EMAIL = 'viewer@crm.com';
export const HIDDEN_LEAD_COLUMNS = ['Email', 'Phone'] as const;
export const EMAIL_VALUE_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// Whole-cell match: a phone cell is only digits, spaces, dashes and an optional +, so names like "Lead_1794384305536" don't match.
export const PHONE_VALUE_PATTERN = /^\+?\d[\d\s-]{6,}\d$/;

// AIO-395 / AIO-T203: shared expected status and block message.
export const CONVERTED_LEAD_STATUS = 'Converted';
export const NON_CONVERTED_LEAD_STATUS = 'New';
export const ALREADY_CONVERTED_MESSAGE = 'This lead is already converted.';

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

export const UX_LEADS = Array.from({ length: 80 }, (_, i) => ({
    id: `aio66-lead-${i}`, name: `AIO66 Lead ${String(i).padStart(2, '0')}`,
    company: `AIO66 Company ${i}`, email: `aio66-${i}@example.com`,
    phone: '+15555550123', status: 'New', source: 'Event', ownerId: '',
    value: i, createdAt: '2026-01-01T00:00:00.000Z',
}));
export const UX_STATUSES = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'AIO66 Custom'];
export const UX_VALID_CONTACT = { name: 'AIO66 Contact', email: 'aio66-contact@example.com', account: 'AIO66 Account' };
export const UX_INVALID_EMAIL = 'not-an-email';
export const NO_LEADS_MESSAGE = 'No leads yet.';
export const UX_VALIDATION = { name: 'Contact name is required.', email: 'Enter a valid contact email.' };
