import { test as setup } from '@fixtures/CrmFixtures';
import { AUTH_ROLES } from '../src/data/auth.data';

// One form login per role; every other CRM spec reuses the saved storageState (auth/<role>.json).
for (const role of AUTH_ROLES) {
  setup(`authenticate ${role}`, async ({ crmLoginPage, dashboardPage }) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginAsRole(role);
    await dashboardPage.waitForDashBoardPage();
    await dashboardPage.assertProfileIconVisible();
    await crmLoginPage.saveRoleSession(role);
  });
}
