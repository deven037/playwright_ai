// AIO-331: account-5 is the seeded "Solaris Systems" account used for the rejected-save check.
export const EDIT_ACCOUNT = { id: 'account-5', name: 'Solaris Systems' } as const;
export const SAVE_ACCOUNT_ERROR = 'Account couldn’t be saved. Your entries are kept. Try again.';
export const REJECTED_SAVE_BODY = { message: 'Controlled save failure for AIO-T149' };
export const EDITED_PHONE = '5559876543';

export const NEGATIVE_EMPLOYEES_MESSAGE = 'Employees can’t be negative.';
export const NEGATIVE_REVENUE_MESSAGE = 'Annual revenue can’t be negative.';

export const NEW_ACCOUNT_PATH = /\/accounts\/new/;

/** Labels of the new-account form and the id of the control each one must focus. */
export const ACCOUNT_FORM_LABELS = [
  { label: 'Employees', controlId: 'account-employees-input' },
  { label: 'Annual revenue', controlId: 'account-revenue-input' },
  { label: 'Phone', controlId: 'account-phone-input' },
  { label: 'Industry', controlId: 'account-industry-input' },
  { label: 'Owner', controlId: 'account-owner-input' },
] as const;

/** Controls whose accessible name must match their label. */
export const ACCOUNT_FORM_ACCESSIBLE_NAMES = [
  { controlId: 'account-industry-input', name: 'Industry' },
  { controlId: 'account-owner-input', name: 'Owner' },
  { controlId: 'account-phone-input', name: 'Phone' },
] as const;

// AIO-344 / AIO-337: rejected save on the create form (AIO-T150, AIO-T151, AIO-T152).
export const REJECTED_CREATE_NAME = 'QA Reject Test';
export const RETRY_ACCOUNT_NAME_PREFIX = 'Account_Retry_';
export const REJECTED_CREATE_BODY = { message: 'Controlled create failure for AIO-T150' };
export const INVALID_CREATE_BODY = { message: 'Controlled validation failure for AIO-T151' };

// AIO-337 / AIO-T200: rejected create and inline save keep the draft and recover the controls.
export const DRAFT_ACCOUNT_NAME = 'QA Draft Account';
export const SERVER_ERROR_BODY = { error: { code: 'server_error', message: 'Simulated save failure' } };

export const ACCOUNT_FORM_VIEWPORTS = [
  { width: 375, height: 800 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const;

// AIO-345 / AIO-T162: search matches name and industry, case-insensitive and trimmed (AIO-148 AC2).
export const INDUSTRY_SEARCH_PADDED = '  Finance ';
export const INDUSTRY_SEARCH_ACCOUNTS = ['Nimbus Tech', 'PixelForge'] as const;
export const NAME_SEARCH_UPPERCASE = 'ZENITH';
export const NAME_SEARCH_ACCOUNTS = ['Zenith Corp'] as const;
