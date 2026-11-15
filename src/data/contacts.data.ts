// Anchored patterns: the label text may or may not carry a required-field asterisk in its accessible name.
export const CONTACT_FORM = {
  labels: [/^Full name(\s*\*)?$/, /^Email(\s*\*)?$/, /^Phone$/, /^Job title$/],
  nameError: 'Name is required.',
  emailError: 'Enter a valid email.',
} as const;

export const CONTACT_HARBOR = {
  recordPath: '/contacts/contact-1',
  layoutId: 'layout-default-contacts',
  layoutName: 'Default',
  newFormPath: '/contacts/new?layout=layout-default-contacts',
  factLabels: ['Email', 'Phone', 'Account', 'Created'],
  tabNames: [/^Overview$/, /^Activity$/, /^Notes \(\d+\)$/, /^Files \(\d+\)$/],
  widths: [1440, 768, 375],
} as const;
