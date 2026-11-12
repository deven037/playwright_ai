import { WarmUpPage } from '@pages/CRM/warmUp.page';
import { SearchPage } from '@pages/CRM/search.page';
import { NotificationsPage } from '@pages/CRM/notifications.page';
import { CrmLoginPage } from '@pages/CRM/crm.login.page';
import { test as base } from './BaseFixtures';
import { DashboardPage } from '@pages/CRM/dashboard.page';
import { LeadsPage } from '@pages/CRM/leads.page';
import { Product } from '@pages/CRM/product.page';
import { Admin } from '@pages/CRM/admin.page';
import { ContactsPage } from '@pages/CRM/contacts.page';
import { AssignmentRulePage } from '@pages/CRM/Rules/assignment.rule.page';
import { DealsPage } from '@pages/CRM/deals.page';
import { AccountsPage } from '@pages/CRM/accounts.page';
import { TicketsPage } from '@pages/CRM/tickets.page';
import { ThemePage } from '@pages/CRM/theme.page';
import { AuthManager, CrmRole } from '../utils/AuthManager';
import { Logger } from '../utils/Logger';

const logger = Logger.getInstance();

/**
 * NewAppFixtures (SCAFFOLD)
 *
 * Page Object fixture wiring for the new application.
 * Rename "NewApp"/"newApp" throughout this project once the real app
 * name is known (this file, src/pages/newApp/, tests/newApp/, the
 * NEWAPP_* env vars in EnvManager + .env.example, and the `test:newapp`
 * script in package.json).
 *
 * TODO once the application URL/pages are known:
 *   1. Build page objects under src/pages/newApp/ (extend BasePage —
 *      see src/pages/newApp/README.md and src/pages/login.page.ts
 *      for the pattern used by the existing app).
 *   2. Import each page class below and add it to NewAppPageFixtures.
 *   3. Register a fixture for each page, following PageFixtures.ts.
 *
 * Example (uncomment + adjust once you have a HomePage):
 *
 *   import { HomePage } from '../pages/newApp/home.page';
 *
 *   export type NewAppPageFixtures = {
 *     homePage: HomePage;
 *   };
 *
 *   export const test = base.extend<NewAppPageFixtures>({
 *     homePage: async ({ page }, use) => {
 *       await use(new HomePage(page));
 *     },
 *   });
 */

/**
 * Signed-in role of the test's browser context. The default is 'admin': the context starts with the
 * storageState saved by global-setup.ts, so specs do not log in. Use 'anonymous' (a fresh, signed-out
 * context) for specs that exercise the login form itself:
 *   test.use({ role: 'anonymous' });
 * and 'rep' / 'viewer' for role-specific checks.
 */
export type CrmTestRole = CrmRole | 'anonymous';

/** Warm-up runs before auth setup. Other entries still use form login until AIO-284 migrates them. */
const FORM_LOGIN_SPECS = [
  'Accounts/accountEditRejectedSave.feature.test.ts',
  'Accounts/accountFormValidation.feature.test.ts',
  'Leads/verifyLeadRecordConvertAction.feature.test.ts',
  'Leads/verifyViewerLeadsHideContactFields.feature.test.ts',
  'Leads/verifyLeadsKeyboardAccessibility.feature.test.ts',
  'Shell/themeVariables.feature.test.ts',
  'WarmUp/warmUp.feature.test.ts',
  'WarmUp/warmUpLive.feature.test.ts',
  'Assignment Rule/verifyAssignmentRuleCreationOnLead.feature.test.ts',
  'Assignment Rule/AssignmentRuleTriggerLead.feature.test.ts',
  'Assignment Rule/VerifyAssignmentRuleCreationOnDeals.feature.test.ts',
  'Shell/bankProfileFallback.feature.test.ts',
  'Tickets/verifyTicketWorkflowAndDeletion.feature.test.ts',
  'Dashboard/dashboardActivityLink.feature.test.ts',
  'Notifications/notificationsZeroUnread.feature.test.ts',
  'Search/seeAllRefreshesList.feature.test.ts',
  'Search/searchErrorEscape.feature.test.ts',
  'Search/globalSearch.feature.test.ts',
  'Search/searchApiRoles.feature.test.ts',
  'Users/verifyUserCreation.feature.test.ts',
  'Contacts/contactFormAccessibility.feature.test.ts',
];

export type CRMPageFixtures = {
  warmUpPage: WarmUpPage;
  searchPage: SearchPage;
  notificationsPage: NotificationsPage;
  crmLoginPage: CrmLoginPage;
  dashboardPage: DashboardPage;
  leadsPage: LeadsPage;
  productsPage: Product;
  adminPage: Admin;
  contactsPage: ContactsPage;
  assignmentRulesPage: AssignmentRulePage;
  dealsPage: DealsPage;
  accountsPage: AccountsPage;
  ticketsPage: TicketsPage;
  themePage: ThemePage;
};

export type CRMRoleOptions = {
  role: CrmTestRole;
};

export const test = base.extend<CRMPageFixtures & CRMRoleOptions>({
  role: ['admin', { option: true }],

  context: async ({ browser, role }, use, testInfo) => {
    // Specs not yet migrated (AIO-284) still sign in through the login form, so they keep a signed-out context.
    const file = testInfo.file.replace(/\\/g, '/');
    const effectiveRole: CrmTestRole = FORM_LOGIN_SPECS.some((spec) => file.endsWith(spec)) ? 'anonymous' : role;
    logger.info(`Creating fresh browser context for test (role: ${effectiveRole})`);
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      storageState: effectiveRole === 'anonymous' ? undefined : AuthManager.getInstance().getAuthFilePath(effectiveRole),
    });
    await use(context);
    logger.info('Closing browser context after test');
    await context.close();
  },

  warmUpPage: async ({ page }, use) => { await use(new WarmUpPage(page)); },
  searchPage: async ({ page }, use) => {
    const searchPage = new SearchPage(page);
    try { await use(searchPage); } finally { await searchPage.cleanupFixtures(); }
  },
  notificationsPage: async ({ page }, use) => {
    const notificationsPage = new NotificationsPage(page);
    await use(notificationsPage);
  },
  crmLoginPage: async ({ page }, use) => {
    const crmLoginPage = new CrmLoginPage(page);
    await use(crmLoginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  leadsPage: async ({ page }, use) => {
    const leadsPage = new LeadsPage(page);
    await use(leadsPage);
  },

  productsPage: async ({page}, use) => {
    const productsPage = new Product(page);
    await use(productsPage);
  },

  adminPage: async ({page}, use) => {
    const adminPage = new Admin(page);
    await use(adminPage);
  },

  contactsPage: async ({page}, use) => {
    const contactsPage = new ContactsPage(page);
    await use(contactsPage);
  },

  assignmentRulesPage: async ({page}, use) => {
    const assignmentRulesPage = new AssignmentRulePage(page);
    await use(assignmentRulesPage);
  },
  
  dealsPage: async ({page}, use) => {
    const dealsPage = new DealsPage(page);
    await use(dealsPage);
  },

  accountsPage: async ({page}, use) => {
    const accountsPage = new AccountsPage(page);
    await use(accountsPage);
  },

  ticketsPage: async ({page}, use) => {
    const ticketsPage = new TicketsPage(page);
    await use(ticketsPage);
  },
  themePage: async ({page}, use) => {
    const themePage = new ThemePage(page);
    await use(themePage);
  },
});

export const crmTest = test;
export { expect } from '@playwright/test';
