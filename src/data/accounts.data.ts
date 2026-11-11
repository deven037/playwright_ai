// AIO-331: account-5 is the seeded "Solaris Systems" account used for the rejected-save check.
export const EDIT_ACCOUNT = { id: 'account-5', name: 'Solaris Systems' } as const;
export const SAVE_ACCOUNT_ERROR = 'Account couldn’t be saved. Your entries are kept. Try again.';
export const REJECTED_SAVE_BODY = { message: 'Controlled save failure for AIO-T149' };
export const EDITED_PHONE = '5559876543';

// AIO-344 / AIO-337: rejected save on the create form (AIO-T150, AIO-T151, AIO-T152).
export const REJECTED_CREATE_NAME = 'QA Reject Test';
export const REJECTED_CREATE_BODY = { message: 'Controlled create failure for AIO-T150' };
export const INVALID_CREATE_BODY = { message: 'Controlled validation failure for AIO-T151' };
export const CREATE_ACCOUNT_VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const;
