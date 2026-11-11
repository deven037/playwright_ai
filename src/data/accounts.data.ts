// AIO-331: account-5 is the seeded "Solaris Systems" account used for the rejected-save check.
export const EDIT_ACCOUNT = { id: 'account-5', name: 'Solaris Systems' } as const;
export const SAVE_ACCOUNT_ERROR = 'Account couldn’t be saved. Your entries are kept. Try again.';
export const REJECTED_SAVE_BODY = { message: 'Controlled save failure for AIO-T149' };
export const EDITED_PHONE = '5559876543';

// AIO-325: account-1 has a long website link that used to push the detail page wider than 375 px.
export const OVERFLOW_ACCOUNT_ID = 'account-1';
export const NARROW_VIEWPORT = { width: 375, height: 900 } as const;
