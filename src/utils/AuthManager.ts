import { Page, BrowserContext } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { EnvManager } from './EnvManager';
import { Logger } from './Logger';
import { ICredentials } from '../types';

const AUTH_FILE = path.resolve('auth', 'storageState.json');

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
  public hasSavedSession(): boolean {
    if (!fs.existsSync(AUTH_FILE)) return false;
    const stats = fs.statSync(AUTH_FILE);
    const ageMs = Date.now() - stats.mtimeMs;
    return ageMs < 12 * 60 * 60 * 1000; // 12 hours
  }

  /** Returns the auth file path for storageState */
  public getAuthFilePath(): string {
    return AUTH_FILE;
  }

  /** Saves browser context storage state to file */
  public async saveSession(context: BrowserContext): Promise<void> {
    await context.storageState({ path: AUTH_FILE });
    this.logger.info('  Auth session saved to storageState.json');
  }

  /** Clears saved session file */
  public clearSession(): void {
    if (fs.existsSync(AUTH_FILE)) {
      fs.unlinkSync(AUTH_FILE);
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
