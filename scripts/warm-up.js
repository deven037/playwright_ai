'use strict';
// AIO-229 / AIO-247: staging warm-up. The logic (warm) is tested offline by
// tests/crm tests/feature/WarmUp/warmUp.feature.test.ts; running this file performs the real warm-up.
// Never emit browser/fetch exception text, request data, or credentials.

const REQUIRED_CONFIG = ['NEWAPP_BASE_API', 'NEWAPP_BASE_URL', 'NEWAPP_EMAIL', 'NEWAPP_PASSWORD'];
const MAX_ATTEMPTS = 20;
const FAST_MS = 3000;
const FAST_STREAK = 2;

async function warm(env, probe, pause, report) {
  for (const key of REQUIRED_CONFIG) {
    if (!env[key]?.trim()) throw new Error('Missing configuration: ' + key);
  }
  let fast = 0;
  for (let n = 1; n <= MAX_ATTEMPTS; n++) {
    let result;
    try { result = await probe(); }
    catch { result = { status: 0, ms: Infinity, ready: false }; }
    report(n, result);
    fast = result.status === 200 && result.ms < FAST_MS && result.ready ? fast + 1 : 0;
    if (fast === FAST_STREAK) return;
    if (n < MAX_ATTEMPTS) await pause();
  }
  throw new Error('Staging warm-up exhausted ' + MAX_ATTEMPTS + ' attempts');
}

module.exports = { warm, REQUIRED_CONFIG, MAX_ATTEMPTS };

if (require.main === module) {
  const { spawnSync } = require('node:child_process');
  const result = spawnSync(process.execPath, [
    require.resolve('@playwright/test/cli'),
    'test', '-c', 'playwright.warmup.config.ts',
  ], { stdio: 'inherit', env: { ...process.env, WARMUP_LIVE: '1' } });
  process.exitCode = result.status ?? 1;
}
