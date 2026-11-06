import type { WarmUpResult } from '../utils/warmUp';

export const WARM_UP_READY: WarmUpResult = { status: 200, ms: 100, ready: true };

// One bad probe outcome each: too slow (at the 3000 ms limit), non-200, login not ready, transport error.
export const WARM_UP_BAD_PROBES: { name: string; value: WarmUpResult | Error }[] = [
  { name: 'slow response', value: { ...WARM_UP_READY, ms: 3000 } },
  { name: 'HTTP 503', value: { ...WARM_UP_READY, status: 503 } },
  { name: 'login not ready', value: { ...WARM_UP_READY, ready: false } },
  { name: 'transport error', value: new Error('transport') },
];

export const WARM_UP_BLANK_VALUES: (string | undefined)[] = [undefined, '', ' '];
export const WARM_UP_EXHAUSTED = /exhausted 20 attempts/;
export const WARM_UP_MISSING = /Missing configuration/;
