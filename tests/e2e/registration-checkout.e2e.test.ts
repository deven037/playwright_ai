import { test, expect } from '../../src/fixtures/PageFixtures';

test('@e2e TC_REGISTRATION_CHECKOUT_001 - New user should register and complete an order',
  async ({
    loginPage,
    registrationPage,
    homePage,
    productPage,
    cartPage,
    orderConfirmationPage,
  }) => {
    const user = registrationPage.generateRandomUser();

    await loginPage.goto();
    await loginPage.clickCreateAccount();
    await registrationPage.waitForPageLoad();
    await registrationPage.register(user);
    await registrationPage.assertRegistrationSuccess(user.firstName);

    await homePage.hoverOptionMenu('Apparel & accessories');
    await homePage.clickSubMenu('T-Shirts');
    await productPage.waitForPageLoad();
    const productName = await productPage.selectAndAddProductToCart();

    await cartPage.waitForPageLoad();
    await cartPage.proceedToCheckout();
    await cartPage.confirmOrder();

    await orderConfirmationPage.waitForPageLoad();
    const orderId = await orderConfirmationPage.getOrderID();

    expect(productName).not.toBe('');
    expect(orderId).toMatch(/^\d+$/);
  });
