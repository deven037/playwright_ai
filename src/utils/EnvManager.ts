import * as dotenv from 'dotenv';
import * as path from 'path';
import { IEnvConfig } from '../types';

// Locally, override=true ensures .env values always take precedence over system env vars.
// This prevents Windows built-in vars like USERNAME from polluting our config.
// In CI the pipeline's variables win (TARGET_ENV picks the environment whose NEWAPP_* URLs apply),
// and .env only fills in what the pipeline doesn't set.
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: !process.env.CI });

/**
 * EnvManager - Singleton class for centralized environment configuration.
 * Reads from .env and exposes typed accessors.
 * Never hardcodes credentials.
 *
 * NOTE: Uses APP_USERNAME / APP_PASSWORD keys to avoid collision with
 * Windows system environment variables (USERNAME is a reserved Windows var).
 */
export class EnvManager implements IEnvConfig {
  private static instance: EnvManager;

  // --- Private backing fields ----------------------------------------------
  private readonly _baseUrl: string;
  private readonly _apiBaseUrl: string;
  private readonly _authApi: string;
  private readonly _username: string;
  private readonly _password: string;
  private readonly _headless: boolean;
  private readonly _browser: string;
  private readonly _slowMo: number;
  private readonly _timeout: number;
  private readonly _retries: number;
  private readonly _workers: number;

  // --- New application (SCAFFOLD) ------------------------------------------
  // Rename NEWAPP_* once the real app name is known. Blank by default until
  // the URL and role credentials are configured.
  private readonly _newAppBaseUrl: string;
  private readonly _newAppEmail: string;
  private readonly _newAppRepEmail: string;
  private readonly _newAppViewerEmail: string;
  private readonly _newAppPassword: string;
  private readonly _newAppBaseAPI: string;

  // --- AI self-healing locators ---------------------------------------------
  private readonly _aiHealingEnabled: boolean;
  private readonly _aiHealingProviderOrder: string[];
  private readonly _groqApiKey: string;
  private readonly _groqModel: string;
  private readonly _aiHealingTimeoutMs: number;
  private readonly _aiHealingLlmTimeoutMs: number;
  private readonly _aiHealingMaxAttempts: number;
  private readonly _aiHealingMaxExploreRounds: number;
  private readonly _aiHealingCache: boolean;

  private constructor() {
    this._baseUrl   = process.env.BASE_URL      ?? '';
    this._apiBaseUrl = process.env.API_BASE_URL ?? '';
    this._authApi   = process.env.AUTH_API     ?? '';
    this._username  = process.env.APP_USERNAME  ?? '';
    this._password  = process.env.APP_PASSWORD  ?? '';
    this._headless  = process.env.HEADLESS      === 'true';
    this._browser   = process.env.BROWSER       ?? 'chromium';
    this._slowMo    = parseInt(process.env.SLOW_MO  ?? '0', 10);
    this._timeout   = parseInt(process.env.TIMEOUT  ?? '30000', 10);
    this._retries   = parseInt(process.env.RETRIES  ?? '1', 10);
    this._workers   = parseInt(process.env.WORKERS  ?? '2', 10);

    this._newAppBaseUrl  = process.env.NEWAPP_BASE_URL ?? '';
    this._newAppEmail = process.env.NEWAPP_EMAIL ?? '';
    this._newAppRepEmail = process.env.NEWAPP_REP_EMAIL ?? '';
    this._newAppViewerEmail = process.env.NEWAPP_VIEWER_EMAIL ?? '';
    this._newAppPassword = process.env.NEWAPP_PASSWORD ?? '';
    this._newAppBaseAPI = process.env.NEWAPP_BASE_API ?? '';

    this._aiHealingEnabled = process.env.AI_HEALING_ENABLED === 'true';
    this._aiHealingProviderOrder = (process.env.AI_HEALING_PROVIDER_ORDER ?? 'groq')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    this._groqApiKey   = process.env.GROQ_API_KEY ?? '';
    this._groqModel    = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
    this._aiHealingTimeoutMs        = parseInt(process.env.AI_HEALING_TIMEOUT_MS ?? '5000', 10);
    this._aiHealingLlmTimeoutMs     = parseInt(process.env.AI_HEALING_LLM_TIMEOUT_MS ?? '10000', 10);
    this._aiHealingMaxAttempts      = parseInt(process.env.AI_HEALING_MAX_ATTEMPTS ?? '1', 10);
    this._aiHealingMaxExploreRounds = parseInt(process.env.AI_HEALING_MAX_EXPLORE_ROUNDS ?? '6', 10);
    this._aiHealingCache            = process.env.AI_HEALING_CACHE !== 'false';
  }

  /** Returns the singleton instance */
  public static getInstance(): EnvManager {
    if (!EnvManager.instance) {
      EnvManager.instance = new EnvManager();
    }
    return EnvManager.instance;
  }

  // --- Public Accessors ----------------------------------------------------
  get baseUrl():  string  { return this._baseUrl;  }
  get apiBaseUrl(): string { return this._apiBaseUrl; }
  get authApi(): string { return this._authApi; }
  get username(): string  { return this._username;  }
  get password(): string  { return this._password; }
  get headless(): boolean { return this._headless; }
  get browser():  string  { return this._browser;  }
  get slowMo():   number  { return this._slowMo;   }
  get timeout():  number  { return this._timeout;  }
  get retries():  number  { return this._retries;  }
  get workers():  number  { return this._workers;  }

  // New application (SCAFFOLD) — rename once the application name is known
  get newAppBaseUrl():  string { return this._newAppBaseUrl;  }
  get newAppEmail(): string { return this._newAppEmail; }
  get newAppRepEmail(): string { return this._newAppRepEmail; }
  get newAppViewerEmail(): string { return this._newAppViewerEmail; }
  get newAppPassword(): string { return this._newAppPassword; }
  get newAppBaseAPI(): string { return this._newAppBaseAPI; }

  // AI self-healing locators
  get aiHealingEnabled(): boolean { return this._aiHealingEnabled; }
  get aiHealingProviderOrder(): string[] { return this._aiHealingProviderOrder; }
  get groqApiKey(): string { return this._groqApiKey; }
  get groqModel(): string { return this._groqModel; }
  get aiHealingTimeoutMs(): number { return this._aiHealingTimeoutMs; }
  get aiHealingLlmTimeoutMs(): number { return this._aiHealingLlmTimeoutMs; }
  get aiHealingMaxAttempts(): number { return this._aiHealingMaxAttempts; }
  get aiHealingMaxExploreRounds(): number { return this._aiHealingMaxExploreRounds; }
  get aiHealingCache(): boolean { return this._aiHealingCache; }

  /** Validates all required env variables are present */
  public validate(): void {
    const required: (keyof IEnvConfig)[] = ['baseUrl', 'username', 'password'];
    const missing = required.filter((key) => !this[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}
