import { FullConfig, chromium } from '@playwright/test';
import { EnvManager } from './src/utils/EnvManager';
import { Logger } from './src/utils/Logger';
import { AuthManager, CRM_ROLES, CrmRole } from './src/utils/AuthManager';
import { CrmLoginPage } from './src/pages/CRM/crm.login.page';
import { DashboardPage } from './src/pages/CRM/dashboard.page';
import * as fs from 'fs';
import * as path from 'path';

const logger = Logger.getInstance();

/** Signs in once per CRM role through the login form and saves each role's storageState under auth/. */
async function authenticateRoles(): Promise<void> {
  const env = EnvManager.getInstance();
  const auth = AuthManager.getInstance();
  const emails: Record<CrmRole, string> = {
    admin: env.newAppEmail,
    rep: env.newAppRepEmail,
    viewer: env.newAppViewerEmail,
  };

  const browser = await chromium.launch({ headless: true });
  try {
    for (const role of CRM_ROLES) {
      const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1920, height: 1080 } });
      try {
        const page = await context.newPage();
        const loginPage = new CrmLoginPage(page);
        await loginPage.goto();
        // Remember me stores the token in localStorage, which Playwright storageState preserves.
        await loginPage.loginWithCustomCredentials(emails[role], true);
        await new DashboardPage(page).waitForDashBoardPage();
        await auth.saveSession(context, role);
        const saved = JSON.parse(fs.readFileSync(auth.getAuthFilePath(role), 'utf-8'));
        const hasToken = (saved.origins ?? []).some((o: { localStorage: { name: string }[] }) =>
          o.localStorage.some((item) => item.name === 'crm.token'));
        if (!hasToken) throw new Error(`[AUTH] ${role} storageState has no crm.token in localStorage; reuse would start signed out`);
        logger.info(`[AUTH] ${role} session saved (1 login)`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

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

  //reset app
  const baseURL = process.env.NEWAPP_BASE_API;
  const res = await fetch(`${baseURL}/api/reset`, { method: 'POST' });
  if (res.ok){
    logger.info('[RESET] Application Resetted')
  } else {throw new Error(`Failed to reset before suite: ${res.status}`);}

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

  // Authenticate once per role, after the reset so the saved sessions match the seeded users
  await authenticateRoles();

  logger.info('[PASS]  Global setup completed successfully.');
  logger.info('==================================================');
}

export default globalSetup;
