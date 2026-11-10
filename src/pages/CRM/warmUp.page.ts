import { BasePage } from '../../core/BasePage';
import { CrmLoginPage } from './crm.login.page';
import { DashboardPage } from './dashboard.page';
import { warm, REQUIRED_CONFIG, MAX_ATTEMPTS, ProbeResult } from '../../../scripts/warm-up';
import { GOOD_PROBE } from '../../data/warmUp.data';

export interface WarmUpOutcome {
  error?: Error;
  probeCalls: number;
  pauses: number;
  /** true only when warm() returned, i.e. the command after the warm-up would run */
  reachedTestCommand: boolean;
}

/** Drives warm() with scripted probes; the page fixture requires an installed browser, but offline cases use no network or credentials. */
export class WarmUpPage extends BasePage {
  async waitForPageLoad(): Promise<void> { await new DashboardPage(this.page).waitForWarmUpReady(); }

  readonly requiredKeys = REQUIRED_CONFIG;
  readonly maxAttempts = MAX_ATTEMPTS;

  configured(): Record<string, string | undefined> {
    return Object.fromEntries(REQUIRED_CONFIG.map(key => [key, 'fixture']));
  }

  /** Fast streak after `prefix`: prefix results, then two good ones. */
  async runUntilReady(prefix: (ProbeResult | Error)[]): Promise<WarmUpOutcome> {
    return this.run([...prefix, GOOD_PROBE, GOOD_PROBE]);
  }

  /** The same non-ready result on every attempt. */
  async runAlways(value: ProbeResult | Error): Promise<WarmUpOutcome> {
    return this.run(Array(MAX_ATTEMPTS).fill(value));
  }

  async runWithConfig(env: Record<string, string | undefined>): Promise<WarmUpOutcome> {
    return this.run([], env, true);
  }

  async warmStaging(): Promise<void> {
    const env = process.env;
    await warm(env, async () => {
      const start = Date.now();
      const response = await fetch(env.NEWAPP_BASE_API!.replace(/\/$/, '') + '/api/health',
        { signal: AbortSignal.timeout(30000) });
      await response.body?.cancel();
      const status = response.status;
      if (status !== 200) return { status, ms: Date.now() - start, ready: false };
      const context = await this.page.context().browser()!.newContext();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const attempt = async () => {
          const page = await context.newPage();
          page.setDefaultTimeout(30000);
          page.setDefaultNavigationTimeout(30000);
          await new CrmLoginPage(page).warmUpLogin(env.NEWAPP_BASE_URL!, env.NEWAPP_EMAIL!, env.NEWAPP_PASSWORD!);
          await new DashboardPage(page).waitForWarmUpReady();
          return { status, ms: Date.now() - start, ready: true };
        };
        return await Promise.race([attempt(), new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('attempt timeout')), Math.max(1, 45000 - (Date.now() - start)));
        })]);
      } finally { clearTimeout(timer); await context.close(); }
    }, () => new Promise(resolve => setTimeout(resolve, 10000)),
    (n, r) => console.log('warm-up ' + n + ': API health HTTP ' + r.status +
      '; login/bootstrap ready=' + r.ready + '; total ms=' + r.ms));
    console.log('warm-up complete: continuing to Playwright test command');
  }

  private async run(
    sequence: (ProbeResult | Error)[],
    env: Record<string, string | undefined> = this.configured(),
    probeForbidden = false,
  ): Promise<WarmUpOutcome> {
    const outcome: WarmUpOutcome = { probeCalls: 0, pauses: 0, reachedTestCommand: false };
    try {
      await warm(env, async () => {
        outcome.probeCalls++;
        if (probeForbidden) throw new Error('probe reached with missing configuration');
        const value = sequence[outcome.probeCalls - 1];
        if (value instanceof Error) throw value;
        return value;
      }, async () => { outcome.pauses++; }, () => {});
      outcome.reachedTestCommand = true;
    } catch (error) {
      outcome.error = error as Error;
    }
    return outcome;
  }
}
