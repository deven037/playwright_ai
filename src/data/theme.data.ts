// Harbor theme variables (AIO-134): expected token names and the viewport widths checked for layout.
export const REQUIRED_TOKENS = ['--accent', '--danger', '--on-accent', '--font-sans', '--font-mono'];

export const TOKEN_PREFIXES = ['--radius-', '--space-', '--shadow-'];

export const VIEWPORT_WIDTHS = [375, 768, 1440];

export const VIEWPORT_HEIGHT = 900;

// AIO-404 / AIO-T210: the bank theme (--bank-primary) and name seen on Login must drive the shell after login.
export const BANK_NAME = 'APEX';

export const BANK_THEME_ROLES = [
  { role: 'admin', email: 'admin@crm.com' },
  { role: 'rep', email: 'rep@crm.com' },
  { role: 'viewer', email: 'viewer@crm.com' },
] as const;

// Shell pages (path under the base URL) checked for the bank colour and name.
export const BANK_THEME_PATHS = ['/', '/leads', '/contacts'];
