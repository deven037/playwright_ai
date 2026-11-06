import * as path from 'path';

/** CRM demo roles (crm-practice README, "Demo credentials"); all share the NEWAPP_PASSWORD value. */
export type AuthRole = 'admin' | 'rep' | 'viewer';

/** 'none' = start signed out (login specs sign in through the form). */
export type AuthRoleOption = AuthRole | 'none';

export const AUTH_ROLES: AuthRole[] = ['admin', 'rep', 'viewer'];

/** Admin uses the default NEWAPP_EMAIL; Rep and Viewer use these demo accounts. */
export const ROLE_EMAILS: Record<Exclude<AuthRole, 'admin'>, string> = {
  rep: 'rep@crm.com',
  viewer: 'viewer@crm.com',
};

/** Saved storageState of a role; auth/ is git-ignored. */
export const roleAuthFile = (role: AuthRole): string => path.resolve('auth', `${role}.json`);
