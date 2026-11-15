// AIO-411 / AIO-T225: Harbor design metrics (AIO-145 leads-list.html) at desktop and phone widths.
export const HARBOR_VIEWPORTS = {
    desktop: { width: 1440, height: 900 },
    phone: { width: 375, height: 812 },
} as const;

export const HARBOR_LIST_METRICS = {
    desktop: { titleFont: 24, controlHeight: 40 },
    phone: { controlHeight: 44 },
    searchHeight: 44,
    searchRadius: 10,
    newLeadRadius: 10,
    tableHeaderFont: 13,
    tableHeaderHeight: 44,
    tableRowHeight: 56,
    maxPageWidth: 1200,
} as const;

export const LEADS_SUBTITLE_PATTERN = /^\d+ leads, newest first\.$/;
export const LEAD_RECORD_PATH = '/leads/lead-58';
export const NEW_LEAD_PATH = '/leads/new';
export const VIEWER_READ_ONLY_MESSAGE = 'You have read-only access to leads';
export const BULK_ACTIONS = ['Assign owner', 'Mass update', 'Delete'] as const;
