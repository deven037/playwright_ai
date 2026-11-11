// AIO-331: account-5 is the seeded "Solaris Systems" account used for the rejected-save check.
export const EDIT_ACCOUNT = { id: 'account-5', name: 'Solaris Systems' } as const;
export const SAVE_ACCOUNT_ERROR = 'Account couldn’t be saved. Your entries are kept. Try again.';
export const REJECTED_SAVE_BODY = { message: 'Controlled save failure for AIO-T149' };
export const EDITED_PHONE = '5559876543';

// AIO-337 / AIO-344: rejected save on the create form.
export const CREATE_REJECT_NAME = 'QA Reject Test';
export const CREATE_RETRY_NAME_PREFIX = 'QA Retry Test ';
export const CREATE_ACCOUNT_BUTTON = 'Create account';
export const REJECTED_CREATE_BODY = { message: 'Controlled create failure for AIO-T150' };
export const REJECTED_CREATE_422_BODY = { message: 'Controlled validation failure for AIO-T151' };
export const CREATE_VIEWPORT_WIDTHS = [375, 768, 1440] as const;
