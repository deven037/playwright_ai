export interface WarmUpResult { status: number; ms: number; ready: boolean }
export const REQUIRED: string[];
export const MAX_ATTEMPTS: number;
export const FAST_MS: number;
export function warm(
  env: Record<string, string | undefined>,
  probe: () => Promise<WarmUpResult>,
  pause: () => Promise<void>,
  report: (attempt: number, result: WarmUpResult) => void,
): Promise<void>;
