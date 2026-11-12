// AIO-T6 / AIO-T7; approved email examples: AI Brain #97 / #96.
export const LOGIN_EMAIL_DATA = {
  valid: 'user@example.com',
  validTagged: 'first.last+tag@sub.example.org',
  missingDomain: 'user@',
  missingTopLevelDomain: 'user@example.',
  missingLocalPart: '@example.com',
  formatError: 'Enter a valid email address.',
} as const;
