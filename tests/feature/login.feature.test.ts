import { test, expect } from '../../src/fixtures/PageFixtures';

/**
 * Login Module — Test Suite
 *
 * Tags    : @smoke @regression @login
 * Fixture : loginPage (unauthenticated context, injected via PageFixtures)
 * Pattern : Fixture-based page injection — no manual instantiation in tests
 */
test.describe('@feature - Login Feature', () => {

  test.only('@feature TC_LOGIN_001 — Valid user should login successfully with correct credentials',
    async ({ loginPage }) => {

      // ── Arrange ────────────────────────────────────────────────────────────
      await loginPage.goto();

      // ── Act ────────────────────────────────────────────────────────────────
      await loginPage.loginWithDefaultCredentials();

      // ── Assert ─────────────────────────────────────────────────────────────
      await loginPage.assertLoginSuccess();
    });

  test('@feature TC_LOGIN_002 — User should see error message with invalid credentials',
    async ({loginPage}) => {

      await loginPage.goto();

      await loginPage.login('test-automation', 'Test123');

      await loginPage.assertLoginError("Error: Incorrect login or password provided.");
    });

});
