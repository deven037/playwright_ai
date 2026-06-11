import { test } from '../../src/fixtures/PageFixtures';

test.describe('@feature - Registration Feature', () => {
  test('@feature TC_REGISTRATION_001 - New user should register successfully with unique details',
    async ({ loginPage, registrationPage }) => {
      const user = registrationPage.generateRandomUser();

      await loginPage.goto();
      await loginPage.clickCreateAccount();
      await registrationPage.waitForPageLoad();
      await registrationPage.register(user);

      await registrationPage.assertRegistrationSuccess(user.firstName);
    });
});
