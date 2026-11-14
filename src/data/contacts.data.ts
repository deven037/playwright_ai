// Anchored patterns: the label text may or may not carry a required-field asterisk in its accessible name.
export const CONTACT_FORM = {
  labels: [/^Full name(\s*\*)?$/, /^Email(\s*\*)?$/, /^Phone$/, /^Job title$/],
  nameError: 'Name is required.',
  emailError: 'Enter a valid email.',
} as const;

export const VIEWER_CONTACT = {
  path: '/contacts/contact-2',
  name: 'Meera Mehta',
  writeActions: [
    { name: 'Edit', testId: 'edit-contact-btn' },
    { name: 'Upload photo', testId: 'upload-avatar-btn' },
    { name: 'Delete contact', testId: 'delete-contact-btn' },
  ],
} as const;
