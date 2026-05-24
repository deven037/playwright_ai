/**
 * Shared TypeScript interfaces and types for the automation framework.
 */

// --- Environment Configuration ------------------------------------------------
export interface IEnvConfig {
  baseUrl: string;
  username: string;
  password: string;
  headless: boolean;
  browser: string;
  slowMo: number;
  timeout: number;
  retries: number;
  workers: number;
}

// --- User Credentials ---------------------------------------------------------
export interface ICredentials {
  username: string;
  password: string;
}

// --- Test Metadata ------------------------------------------------------------
export interface ITestInfo {
  title: string;
  module: string;
  tags: TestTag[];
  description?: string;
}

// --- Custom Reporter Types ----------------------------------------------------
export interface ITestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  error?: string;
  retries: number;
}

export interface ISuiteResult {
  name: string;
  tests: ITestResult[];
  startTime: Date;
  endTime?: Date;
}

// --- Wait Strategy ------------------------------------------------------------
export type WaitStrategy = 'visible' | 'hidden' | 'attached' | 'detached';
export type TestTag = 'smoke' | 'regression' | 'feature' | 'sanity' | 'e2e';
