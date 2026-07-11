import { test as base } from './BaseFixtures';
import { LoginPage } from '@pages/Store/login.page';
import { HomePage } from '@pages/Store/home.page';
import { ProductsPage } from '@pages/Store/products.page';
import { CartPage } from '@pages/Store/cart.page';
import { OrderConfirmationPage } from '@pages/Store/orderConfirmation.page';
import { RegistrationPage } from '@pages/Store/registration.page';

// Fresh browser context + page per test now come from BaseFixtures.
// This file only wires up this app's Page Objects on top of it.

export type PageFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  productPage: ProductsPage;
  cartPage: CartPage;
  orderConfirmationPage: OrderConfirmationPage;
  registrationPage: RegistrationPage;
};

export const test = base.extend<PageFixtures>({
  // Page fixtures using the fresh page from BaseFixtures
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

  registrationPage: async ({ page }, use) => {
    const registrationPage = new RegistrationPage(page);
    await use(registrationPage);
  },
});

export { expect } from '@playwright/test';
