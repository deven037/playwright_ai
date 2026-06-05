import { test, expect } from '../../src/fixtures/PageFixtures';

test('@e2e TC_ACCESSORIES_001 - User should navigate to any of the sub menu and add to cart',
      async ({
            loginPage,
            homePage,
            productPage,
            cartPage,
            orderConfirmationPage,
            sharedPage
      }) => {
            await loginPage.goto();
            await loginPage.loginWithDefaultCredentials();
            await loginPage.assertLoginSuccess();
            await homePage.hoverOptionMenu('Apparel & accessories');
            await homePage.clickSubMenu('T-Shirts');
            await productPage.selectAndAddProductToCart();
            await cartPage.waitForPageLoad();
            const pageUrl = sharedPage.url();
            const expectedUrl = await productPage.verifyCartPage();
            expect(expectedUrl).toContain(pageUrl);
            const amountOnCartPage = await cartPage.getTotalAmount();
            await cartPage.proceedToCheckout();
            const amountOnOrderSummary = await cartPage.getTotalAmountOnOrderSummary();
            expect(amountOnOrderSummary).toBe(amountOnCartPage);
            await cartPage.confirmOrder();
            await orderConfirmationPage.waitForPageLoad();
            await orderConfirmationPage.getOrderID();
            await orderConfirmationPage.invoiceLink();
            const amountOnInvoice = await orderConfirmationPage.getAmountOnInvoice();
            expect(amountOnInvoice).toBe(amountOnCartPage);
});