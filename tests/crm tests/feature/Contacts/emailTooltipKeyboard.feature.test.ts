import { test, expect } from '@fixtures/CrmFixtures';

test('AIO-T135: Contacts List full email tooltip reachable by Tab @regression', async ({
  crmLoginPage, dashboardPage, contactsPage
}) => {
  await crmLoginPage.goto();
  await crmLoginPage.loginWithDefaultCredentials();
  await dashboardPage.waitForDashBoardPage();
  await dashboardPage.assertProfileIconVisible();

  await contactsPage.openEmailTooltipList();
  const email = await contactsPage.getFirstContactFullEmail();
  expect(email).toBeTruthy();
  await contactsPage.tabFromFirstContactCheckboxToEmail();
  await contactsPage.assertFirstContactEmailTooltip(email);
  await contactsPage.moveFocusOffFirstContactEmail();
  await contactsPage.hoverFirstContactEmail();
  await contactsPage.assertFirstContactEmailTooltip(email);
});
