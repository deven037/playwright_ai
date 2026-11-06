import { test, expect } from '@fixtures/CrmFixtures';
import { warm, REQUIRED, MAX_ATTEMPTS, WarmUpResult } from '../../../../src/utils/warmUp';
import {
  WARM_UP_READY, WARM_UP_BAD_PROBES, WARM_UP_BLANK_VALUES, WARM_UP_EXHAUSTED, WARM_UP_MISSING,
} from '../../../../src/data/warmUp.data';

// AIO-248: offline regression for the staging warm-up loop (moved from .gitlab-ci.yml, AIO-229).
const env = Object.fromEntries(REQUIRED.map(key => [key, 'fixture']));

async function runWarm(sequence: (WarmUpResult | Error)[], config: Record<string, string | undefined> = env) {
  let calls = 0;
  let sleeps = 0;
  await warm(config, async () => {
    const value = sequence[calls++];
    if (value instanceof Error) throw value;
    return value;
  }, async () => { sleeps++; }, () => {});
  return { calls, sleeps };
}

test('@feature @smoke @regression Warm-up - Should finish after two consecutive fast ready probes', async () => {
  const { calls, sleeps } = await runWarm([WARM_UP_READY, WARM_UP_READY]);
  expect(calls).toBe(2);
  expect(sleeps).toBe(1);
});

for (const bad of WARM_UP_BAD_PROBES) {
  test(`@feature @smoke @regression Warm-up - Should reset the fast streak after ${bad.name}`, async () => {
    const { calls } = await runWarm([WARM_UP_READY, bad.value, WARM_UP_READY, WARM_UP_READY]);
    expect(calls).toBe(4);
  });

  test(`@feature @smoke @regression Warm-up - Should fail after ${MAX_ATTEMPTS} attempts of ${bad.name}`, async () => {
    let calls = 0;
    let sleeps = 0;
    await expect(warm(env, async () => {
      calls++;
      if (bad.value instanceof Error) throw bad.value;
      return bad.value;
    }, async () => { sleeps++; }, () => {})).rejects.toThrow(WARM_UP_EXHAUSTED);
    expect(calls).toBe(MAX_ATTEMPTS);
    expect(sleeps).toBe(MAX_ATTEMPTS - 1);
  });
}

for (const key of REQUIRED) {
  test(`@feature @smoke @regression Warm-up - Should reject blank ${key} before probing`, async () => {
    for (const value of WARM_UP_BLANK_VALUES) {
      await expect(warm({ ...env, [key]: value }, async () => {
        throw new Error('probe reached with missing configuration');
      }, async () => {}, () => {})).rejects.toThrow(WARM_UP_MISSING);
    }
  });
}
