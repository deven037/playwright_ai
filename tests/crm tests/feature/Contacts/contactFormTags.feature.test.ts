import { test } from '@fixtures/CrmFixtures';

test.use({ trace: 'on-first-retry' });

test('AIO-T235: New contact form (Default layout) shows the Tags field @smoke @regression', async ({
  crmLoginPage,
  dashboardPage,
  contactsPage,
}) => {
  await crmLoginPage.goto();
  await dashboardPage.waitForDashBoardPage();

  await contactsPage.openDefaultContactForm();
  await contactsPage.assertTagsFieldAfterAccount();
});
