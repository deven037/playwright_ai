import { test, expect } from '@fixtures/CrmFixtures';

test.use({ viewport: { width: 375, height: 812 }, trace: 'on-first-retry' });

test('AIO-T139: Contact form labels and first-error focus @regression', async ({
  crmLoginPage,
  dashboardPage,
  contactsPage,
}) => {
  await crmLoginPage.goto();
  await dashboardPage.waitForDashBoardPage();

  await contactsPage.gotoContacts();
  await contactsPage.clickNewContact();
  await contactsPage.chooseLayout('Default');
  await contactsPage.assertAccessibleEmptyForm();

  await contactsPage.observeContactCreation();
  await contactsPage.createContact();
  await contactsPage.assertEmptySubmitErrorsAndFocus();
  expect(await contactsPage.getContactCreateRequestCount()).toBe(0);
});
