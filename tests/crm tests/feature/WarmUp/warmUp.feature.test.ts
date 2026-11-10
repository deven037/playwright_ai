import { test, expect } from '@fixtures/CrmFixtures';
import {
  BAD_PROBES,
  GOOD_PROBE,
  REQUIRED_KEYS,
  MISSING_VALUES,
  EXHAUSTED_MESSAGE,
  MISSING_CONFIG_MESSAGE,
} from '../../../../src/data/warmUp.data';

// AIO-247 (from AIO-229): offline checks of scripts/warm-up.js; the page fixture needs an installed browser, but probes use no network or credentials.
test.describe('Staging warm-up logic @warmup-offline @regression', () => {
  test('two consecutive fast ready probes finish and reach the test command', async ({ warmUpPage }) => {
    const outcome = await warmUpPage.runUntilReady([]);
    expect(outcome.error).toBeUndefined();
    expect(outcome.reachedTestCommand).toBe(true);
    expect(outcome.probeCalls).toBe(2);
    expect(outcome.pauses).toBe(1);
  });

  for (const bad of BAD_PROBES) {
    test(`a ${bad.name} probe resets the fast streak`, async ({ warmUpPage }) => {
      const outcome = await warmUpPage.runUntilReady([
        GOOD_PROBE, bad.value,
      ]);
      expect(outcome.error).toBeUndefined();
      expect(outcome.reachedTestCommand).toBe(true);
      expect(outcome.probeCalls).toBe(4);
      expect(outcome.pauses).toBe(3);
    });

    test(`a ${bad.name} probe on every attempt exhausts the warm-up and blocks the tests`, async ({ warmUpPage }) => {
      const outcome = await warmUpPage.runAlways(bad.value);
      expect(outcome.error?.message).toMatch(EXHAUSTED_MESSAGE);
      expect(outcome.reachedTestCommand).toBe(false);
      expect(outcome.probeCalls).toBe(warmUpPage.maxAttempts);
      expect(outcome.pauses).toBe(warmUpPage.maxAttempts - 1);
    });
  }

  for (const key of REQUIRED_KEYS) {
    for (const value of MISSING_VALUES) {
      test(`missing ${key} (${JSON.stringify(value)}) fails before any probe`, async ({ warmUpPage }) => {
        const outcome = await warmUpPage.runWithConfig({ ...warmUpPage.configured(), [key]: value });
        expect(outcome.error?.message).toMatch(MISSING_CONFIG_MESSAGE);
        expect(outcome.error?.message).toContain(key);
        expect(outcome.reachedTestCommand).toBe(false);
        expect(outcome.probeCalls).toBe(0);
      });
    }
  }
});
