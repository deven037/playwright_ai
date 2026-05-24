import { FullConfig } from '@playwright/test';
import { EnvManager } from './src/utils/EnvManager';
import { Logger } from './src/utils/Logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = Logger.getInstance();

async function globalSetup(config: FullConfig): Promise<void> {
  logger.info('==================================================');
  logger.info('  PLAYWRIGHT AI FRAMEWORK - GLOBAL SETUP STARTED');
  logger.info('==================================================');

  // Validate environment
  const env = EnvManager.getInstance();
  env.validate();
  logger.info(`  BASE_URL  : ${env.baseUrl}`);
  logger.info(`  BROWSER   : ${env.browser}`);
  logger.info(`  HEADLESS  : ${env.headless}`);
  // logger.info(`  RETRIES    : ${env.retries}`);
  logger.info(`  WORKERS   : ${env.workers}`);

  // Ensure output directories exist
  const dirs = [
    'reports/html-report',
    'reports/json-report',
    'test-results',
    'logs',
    'auth',
  ];
  dirs.forEach((dir) => {
    const fullPath = path.resolve(dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logger.info(`  Created directory: ${dir}`);
    }
  });

  logger.info('[PASS]  Global setup completed successfully.');
  logger.info('==================================================');
}

export default globalSetup;
