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

export const ACCOUNT_FORM_VIEWPORTS = [
  { width: 375, height: 800 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const;
