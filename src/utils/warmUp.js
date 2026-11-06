// AIO-229 / AIO-248: staging warm-up readiness loop, shared by .gitlab-ci.yml and the tracked
// warm-up spec. Plain CommonJS so the CI shell step can require it without a TypeScript build.
const REQUIRED = ['NEWAPP_BASE_API', 'NEWAPP_BASE_URL', 'NEWAPP_EMAIL', 'NEWAPP_PASSWORD'];
const MAX_ATTEMPTS = 20;
const FAST_MS = 3000;
const FAST_STREAK = 2;

async function warm(env, probe, pause, report) {
  for (const key of REQUIRED) {
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

module.exports = { warm, REQUIRED, MAX_ATTEMPTS, FAST_MS };
