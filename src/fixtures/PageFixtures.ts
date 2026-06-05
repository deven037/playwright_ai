import { base_test, BaseFixtures } from './BaseFixtures';
import { LoginPage } from '../pages/login.page';
import { HomePage } from '@pages/home.page';
import { ProductsPage } from '@pages/products.page';
import { Page } from '@playwright/test';
import { CartPage } from '@pages/cart.page';
import { OrderConfirmationPage } from '@pages/orderConfirmation.page';

export type PageFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  productPage: ProductsPage;
  cartPage: CartPage;
  orderConfirmationPage: OrderConfirmationPage;
};

export const test = base_test.extend<PageFixtures & { sharedPage: Page }>({
  sharedPage: async ({ unauthenticatedPage }, use) => {
    await use(unauthenticatedPage);
  },

  loginPage: async ({ sharedPage }, use) => {
    const loginPage = new LoginPage(sharedPage);
    await use(loginPage);
  },

  homePage: async ({ sharedPage }, use) => {
    const homePage = new HomePage(sharedPage);
    await use(homePage);
  },

  productPage: async ({ sharedPage }, use) => {
    const productPage = new ProductsPage(sharedPage);
    await use(productPage);
  },

  cartPage: async ({ sharedPage }, use) => {
    const cartPage = new CartPage(sharedPage);
    await use(cartPage);
  },

  orderConfirmationPage: async ({ sharedPage }, use) => {
    const orderConfirmationPage = new OrderConfirmationPage(sharedPage);
    await use(orderConfirmationPage);
  },
});

export { expect } from '@playwright/test';