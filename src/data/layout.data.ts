// AIO-346 / AIO-325: responsive checks on pages that use the shared .detail-list grid.
export const VIEWPORT_HEIGHT = 800;
export const MOBILE_WIDTH = 375;
export const TABLET_WIDTH = 768;
export const DESKTOP_WIDTH = 1440;
export const ALL_WIDTHS = [MOBILE_WIDTH, TABLET_WIDTH, DESKTOP_WIDTH] as const;

export const ACCOUNT_IDS = ['account-1', 'account-2', 'account-3'] as const;
export const CONTACT_ID = 'contact-1';
export const ACCOUNT_DETAIL_VALUE_COUNT = 6;

// ~100 characters, no spaces: the case that pushed the Details column past 375 px.
export const LONG_UNBROKEN_LINK = `https://${'a'.repeat(90)}.example.test`;
