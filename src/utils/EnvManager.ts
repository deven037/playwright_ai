import * as dotenv from 'dotenv';
import * as path from 'path';
import { IEnvConfig } from '../types';

// Override=true ensures .env values always take precedence over system env vars.
// This prevents Windows built-in vars like USERNAME from polluting our config.
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

/**
 * EnvManager — Singleton class for centralized environment configuration.
 * Reads from .env file and exposes typed accessors.
 * Never hardcodes credentials.
 *
 * NOTE: Uses APP_USERNAME / APP_PASSWORD keys to avoid collision with
 * Windows system environment variables (USERNAME is a reserved Windows var).
 */
export class EnvManager implements IEnvConfig {
  private static instance: EnvManager;

  // ─── Private backing fields ──────────────────────────────────────────────
  private readonly _baseUrl: string;
  private readonly _username: string;
  private readonly _password: string;
  private readonly _headless: boolean;
  private readonly _browser: string;
  private readonly _slowMo: number;
  private readonly _timeout: number;
  private readonly _retries: number;
  private readonly _workers: number;

  private constructor() {
    this._baseUrl   = process.env.BASE_URL      ?? '';
    this._username  = process.env.APP_USERNAME  ?? '';  // APP_USERNAME avoids Windows USERNAME collision
    this._password  = process.env.APP_PASSWORD  ?? '';
    this._headless  = process.env.HEADLESS      === 'true';
    this._browser   = process.env.BROWSER       ?? 'chromium';
    this._slowMo    = parseInt(process.env.SLOW_MO  ?? '0', 10);
    this._timeout   = parseInt(process.env.TIMEOUT  ?? '30000', 10);
    this._retries   = parseInt(process.env.RETRIES  ?? '1', 10);
    this._workers   = parseInt(process.env.WORKERS  ?? '2', 10);
  }

  /** Returns the singleton instance */
  public static getInstance(): EnvManager {
    if (!EnvManager.instance) {
      EnvManager.instance = new EnvManager();
    }
    return EnvManager.instance;
  }

  // ─── Public Accessors ────────────────────────────────────────────────────
  get baseUrl():  string  { return this._baseUrl;  }
  get username(): string  { return this._username; }
  get password(): string  { return this._password; }
  get headless(): boolean { return this._headless; }
  get browser():  string  { return this._browser;  }
  get slowMo():   number  { return this._slowMo;   }
  get timeout():  number  { return this._timeout;  }
  get retries():  number  { return this._retries;  }
  get workers():  number  { return this._workers;  }

  /** Validates all required env variables are present */
  public validate(): void {
    const required: (keyof IEnvConfig)[] = ['baseUrl', 'username', 'password'];
    const missing = required.filter((key) => !this[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}
