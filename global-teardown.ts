import { FullConfig } from '@playwright/test';
import { Logger } from './src/utils/Logger';

const logger = Logger.getInstance();

async function runCleanup(): Promise<void> {
  logger.info('==================================================');
  logger.info('  PLAYWRIGHT AI FRAMEWORK - GLOBAL TEARDOWN');
  logger.info('  Status: running cleanup for this test run');
  logger.info('==================================================');

  const baseURL = process.env.NEWAPP_BASE_API;
  if (!baseURL) {
    logger.warn('NEWAPP_BASE_API is not set. Skipping reset API call.');
    logger.info('[PASS] Global teardown completed with no reset call.');
    return;
  }

  try {
    const response = await fetch(`${baseURL}/api/reset`, { method: 'POST' });
    logger.info(`[RESET] Reset API completed with status ${response.status}`);

    if (!response.ok) {
      throw new Error(`Reset API failed with status ${response.status}`);
    }

    logger.info('[PASS]  All tests completed. Cleaning up resources...');
  } catch (error) {
    logger.error(`Global teardown failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function globalTeardown(config: FullConfig): Promise<void> {
  await runCleanup();
}

export default globalTeardown;
