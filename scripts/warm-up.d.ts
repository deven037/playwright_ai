export interface ProbeResult {
  status: number;
  ms: number;
  ready: boolean;
}

export const REQUIRED_CONFIG: string[];
export const MAX_ATTEMPTS: number;

export function warm(
  env: Record<string, string | undefined>,
  probe: () => Promise<ProbeResult>,
  pause: () => Promise<void>,
  report: (attempt: number, result: ProbeResult) => void,
): Promise<void>;
