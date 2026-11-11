import { test } from '@fixtures/CrmFixtures';
import { ROLE_IDENTITY } from '../../../../src/data/roleAuth.data';

// AIO-250: each role reuses its saved login; contexts never share a session. Serial order makes every
// test follow one with a different identity, so a leaked session would show as the wrong identity.
test.describe.configure({ mode: 'serial' });

test.describe('Saved role sessions @regression', () => {
  test.describe('admin (default)', () => {
    test('opens signed in as Admin without the login form', async ({ crmLoginPage, dashboardPage }) => {
      await crmLoginPage.goto();
      await dashboardPage.waitForDashBoardPage();
      await dashboardPage.assertSignedInAs(ROLE_IDENTITY.admin);
    });
  });

  test.describe('anonymous after admin', () => {
    test.use({ role: 'anonymous' });

    test('a fresh anonymous context shows the login form, not the Admin session', async ({ crmLoginPage }) => {
      await crmLoginPage.goto();
      await crmLoginPage.assertLoginFormVisible();
    });
  });

  test.describe('viewer', () => {
    test.use({ role: 'viewer' });

    test('opens signed in as Viewer, not Admin', async ({ crmLoginPage, dashboardPage }) => {
      await crmLoginPage.goto();
      await dashboardPage.waitForDashBoardPage();
      await dashboardPage.assertSignedInAs(ROLE_IDENTITY.viewer);
    });
  });

  test.describe('rep', () => {
    test.use({ role: 'rep' });

    test('opens signed in as Sales Rep, not Viewer', async ({ crmLoginPage, dashboardPage }) => {
      await crmLoginPage.goto();
      await dashboardPage.waitForDashBoardPage();
      await dashboardPage.assertSignedInAs(ROLE_IDENTITY.rep);
    });
  });

  test.describe('admin again', () => {
    test.use({ role: 'admin' });

    test('a new Admin context is Admin after Rep and Viewer ran', async ({ crmLoginPage, dashboardPage }) => {
      await crmLoginPage.goto();
      await dashboardPage.waitForDashBoardPage();
      await dashboardPage.assertSignedInAs(ROLE_IDENTITY.admin);
    });
  });
});
