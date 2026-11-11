import type { ProbeResult } from '../../scripts/warm-up';

export const GOOD_PROBE: ProbeResult = { status: 200, ms: 100, ready: true };

/** Probe outcomes that must not count as a fast, ready attempt. */
export const BAD_PROBES: { name: string; value: ProbeResult | Error }[] = [
  { name: 'slow (6000 ms)', value: { ...GOOD_PROBE, ms: 6000 } },
  { name: 'HTTP 503', value: { ...GOOD_PROBE, status: 503 } },
  { name: 'login/bootstrap not ready', value: { ...GOOD_PROBE, ready: false } },
  { name: 'transport failure', value: new Error('transport') },
];

/** Values that count as "not configured". */
export const MISSING_VALUES: (string | undefined)[] = [undefined, '', ' '];

export const EXHAUSTED_MESSAGE = /exhausted 20 attempts/;
export const MISSING_CONFIG_MESSAGE = /Missing configuration/;

export { REQUIRED_CONFIG as REQUIRED_KEYS } from '../../scripts/warm-up';
