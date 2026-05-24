import { FullConfig } from '@playwright/test';
import { Logger } from './src/utils/Logger';

const logger = Logger.getInstance();

async function globalTeardown(config: FullConfig): Promise<void> {
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('🏁  PLAYWRIGHT AI FRAMEWORK — GLOBAL TEARDOWN');
  logger.info('✅  All tests completed. Cleaning up resources...');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

export default globalTeardown;
