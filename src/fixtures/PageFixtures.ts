import { base_test, BaseFixtures } from './BaseFixtures';
import { LoginPage } from '../pages/login.page';
import { HomePage } from '@pages/home.page';

// --- Page Fixture Types -------------------------------------------------------
// Add every new page object here as a new fixture type.
// Tests destructure exactly the pages they need - nothing more.

export type PageFixtures = {
  /** LoginPage - unauthenticated context (for login flow tests) */
  loginPage: LoginPage;
  homePage: HomePage;
};

// --- Extended Test with Page Fixtures ----------------------------------------
// Extends base_test (which carries unauthenticatedPage, authenticatedPage, helpers).
// All page objects are instantiated here and injected via fixture.
// Tests never instantiate page classes directly.

export const test = base_test.extend<PageFixtures>({

  // -- LoginPage -------------------------------------------------------------
  // Uses unauthenticatedPage - login tests always start from a clean session.
  loginPage: async ({ unauthenticatedPage }, use) => {
    const loginPage = new LoginPage(unauthenticatedPage);
    await use(loginPage);
  },

  homePage: async ({ unauthenticatedPage }, use) => {
    const homePage = new HomePage(unauthenticatedPage);
    await use(homePage);
  }

  // -- Add new page fixtures below as modules grow ---------------------------
  // Example:
  // dashboardPage: async ({ authenticatedPage }, use) => {
  //   await use(new DashboardPage(authenticatedPage));
  // },
  //
  // productPage: async ({ authenticatedPage }, use) => {
  //   await use(new ProductPage(authenticatedPage));
  // },
});

export { expect } from '@playwright/test';
