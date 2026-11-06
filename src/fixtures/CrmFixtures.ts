import { SearchPage } from '@pages/CRM/search.page';
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
// import { Logger } from '../utils/Logger'; // uncomment if you add logging here

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

export type CRMPageFixtures = {
  searchPage: SearchPage;
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
};

export const test = base.extend<CRMPageFixtures>({
  searchPage: async ({ page }, use) => {
    const searchPage = new SearchPage(page);
    try { await use(searchPage); } finally { await searchPage.cleanupFixtures(); }
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
});

export const crmTest = test;
export { expect } from '@playwright/test';
