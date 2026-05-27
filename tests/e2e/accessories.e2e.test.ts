import { test, expect } from '../../src/fixtures/PageFixtures';

test('@e2e TC_ACCESSORIES_001 - User should navigate to any of the sub menu', async ({ loginPage, homePage }) => {
// -- Arrange ------------------------------------------------------------
      await loginPage.goto();

      // -- Act ----------------------------------------------------------------
      await loginPage.loginWithDefaultCredentials();

      // -- Assert -------------------------------------------------------------
      await loginPage.assertLoginSuccess();

      //hover on the menu
      await homePage.hoverOptionMenu('Apparel & accessories');
});