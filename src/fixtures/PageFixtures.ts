import { test as base, Page, BrowserContext } from '@playwright/test';
import { Logger } from '../utils/Logger';
import { EnvManager } from '../utils/EnvManager';
import { LoginPage } from '../pages/login.page';
import { HomePage } from '@pages/home.page';
import { ProductsPage } from '@pages/products.page';
import { CartPage } from '@pages/cart.page';
import { OrderConfirmationPage } from '@pages/orderConfirmation.page';

const logger = Logger.getInstance();
const env = EnvManager.getInstance();

// --- Custom Fixtures with Fresh Browser Context for Parallel Execution -----

type FixturesWithContext = {
  context: BrowserContext;
  page: Page;
};

export type PageFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  productPage: ProductsPage;
  cartPage: CartPage;
  orderConfirmationPage: OrderConfirmationPage;
};

export const test = base.extend<FixturesWithContext & PageFixtures>({
  // Fresh browser context for each test
  context: async ({ browser }, use) => {
    logger.info('Creating fresh browser context for test');
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
    });
    
    await use(context);
    logger.info('Closing browser context after test');
    await context.close();
  },

  // Fresh page for each test from the context
  page: async ({ context }, use) => {
    logger.info('Creating fresh page in context');
    const page = await context.newPage();
    await use(page);
  },

  // Page fixtures using fresh page
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  productPage: async ({ page }, use) => {
    const productPage = new ProductsPage(page);
    await use(productPage);
  },

  cartPage: async ({ page }, use) => {
    const cartPage = new CartPage(page);
    await use(cartPage);
  },

  orderConfirmationPage: async ({ page }, use) => {
    const orderConfirmationPage = new OrderConfirmationPage(page);
    await use(orderConfirmationPage);
  },
});

export { expect } from '@playwright/test';