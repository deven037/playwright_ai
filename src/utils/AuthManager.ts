import { Page, BrowserContext } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { EnvManager } from './EnvManager';
import { Logger } from './Logger';
import { ICredentials } from '../types';

const AUTH_FILE = path.resolve('auth', 'storageState.json');

/** CRM roles that have a saved authenticated session (see global-setup.ts). */
export type CrmRole = 'admin' | 'rep' | 'viewer';
export const CRM_ROLES: CrmRole[] = ['admin', 'rep', 'viewer'];

/**
 * AuthManager - Handles authentication and session management.
 * Supports storageState reuse to avoid repeated logins.
 */
export class AuthManager {
  private static instance: AuthManager;
  private readonly env = EnvManager.getInstance();
  private readonly logger = Logger.getInstance();

  private constructor() {}

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) AuthManager.instance = new AuthManager();
    return AuthManager.instance;
  }

  /** Returns default credentials from .env */
  public getCredentials(): ICredentials {
    return {
      username: this.env.username,
      password: this.env.password,
    };
  }

  /** Checks if a saved auth state exists and is recent (< 12 hours) */
  public hasSavedSession(role?: CrmRole): boolean {
    const file = this.getAuthFilePath(role);
    if (!fs.existsSync(file)) return false;
    const stats = fs.statSync(file);
    const ageMs = Date.now() - stats.mtimeMs;
    return ageMs < 12 * 60 * 60 * 1000; // 12 hours
  }

  /** Returns the auth file path for storageState (one file per CRM role when a role is given) */
  public getAuthFilePath(role?: CrmRole): string {
    return role ? path.resolve('auth', `storageState.${role}.json`) : AUTH_FILE;
  }

  /** Saves browser context storage state to file */
  public async saveSession(context: BrowserContext, role?: CrmRole): Promise<void> {
    const file = this.getAuthFilePath(role);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await context.storageState({ path: file });
    this.logger.info(`  Auth session saved to ${path.basename(file)}`);
  }

  /** Clears saved session file */
  public clearSession(role?: CrmRole): void {
    const file = this.getAuthFilePath(role);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      this.logger.info('  Auth session cleared.');
    }
  }

  /** Performs login on the given page using credentials from EnvManager */
  public async login(page: Page, credentials?: ICredentials): Promise<void> {
    const creds = credentials ?? this.getCredentials();
    this.logger.step('Navigating to login page');
    await page.goto(`${this.env.baseUrl}index.php?rt=account/login`);

    this.logger.step(`Logging in as: ${creds.username}`);
    await page.locator('#loginFrm_loginname').fill(creds.username);
    await page.locator('#loginFrm_password').fill(creds.password);
    await page.locator("//button[@title='Login']").click();
    await page.waitForLoadState('networkidle');
    this.logger.info('[PASS]  Login successful');
  }
}
