import { test, expect } from '../src/fixtures/PageFixtures';

/**
 * Login Module — Test Suite
 *
 * Tags    : @smoke @regression @login
 * Fixture : loginPage (unauthenticated context, injected via PageFixtures)
 * Pattern : Fixture-based page injection — no manual instantiation in tests
 */
test.describe('Login Module @smoke @regression @login', () => {

  test('TC_LOGIN_001 — Valid user should login successfully with correct credentials',
    async ({ loginPage }) => {

      // ── Arrange ────────────────────────────────────────────────────────────
      await loginPage.goto();

      // ── Act ────────────────────────────────────────────────────────────────
      await loginPage.loginWithDefaultCredentials();

      // ── Assert ─────────────────────────────────────────────────────────────
      await loginPage.assertLoginSuccess();
    });

});
