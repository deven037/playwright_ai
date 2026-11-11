// AIO-149 / AIO-T27: Viewer lacks permission to see lead contact fields (AIO-61 AC4).
// Seeded demo account from the CRM README; its password is read from NEWAPP_PASSWORD like every other login.
export const VIEWER_EMAIL = 'viewer@crm.com';
export const HIDDEN_LEAD_COLUMNS = ['Email', 'Phone'] as const;
export const EMAIL_VALUE_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
export const PHONE_VALUE_PATTERN = /\+?\d[\d\s-]{6,}\d/;
