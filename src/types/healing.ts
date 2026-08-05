/**
 * Types for the AI self-healing locator engine (src/ai/).
 */
import { Locator, Page } from '@playwright/test';

export type HealableAction = 'click' | 'fill' | 'waitForElement' | 'selectOption' | 'assertVisible';

export interface HealRequest {
  page: Page;
  locator: Locator;
  description: string;
  action: HealableAction;
  originalError: Error;
}

export interface HealResult {
  healed: boolean;
  healedLocator?: Locator;
  event: HealingEvent;
}

export interface HealingEvent {
  timestamp: string;
  testTitle: string;
  action: HealableAction;
  description: string;
  originalLocator: string;
  healedLocator?: string;
  provider?: string;
  exploreRounds?: number;
  confidence?: number;
  reasoning?: string;
  success: boolean;
  errorMessage?: string;
}

export type ExploreToolName = 'get_snapshot' | 'inspect_element' | 'scroll_into_view' | 'propose_selector';

export interface ExploreToolParamSchema {
  type: 'object';
  properties: Record<string, { type: string; description: string }>;
  required: string[];
}

export interface ExploreTool {
  name: ExploreToolName;
  description: string;
  parameters: ExploreToolParamSchema;
}

export interface ExploreContext {
  originalSelector: string;
  description: string;
  action: HealableAction;
}

export interface ProposedSelector {
  ref: string;
  confidence: number;
  reasoning: string;
}
