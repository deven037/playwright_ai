import { test, expect } from '@fixtures/CrmFixtures';
import { CONTACT_HARBOR } from '../../../../src/data/contacts.data';

test.use({ role: 'admin', trace: 'on-first-retry' });

test('AIO-T209: Harbor contact record and layout-selected form regression @smoke', async ({
  crmLoginPage,
  contactsPage,
}) => {
  await crmLoginPage.goto();

  // Step 1: identity, bank monogram, key facts, read-only Created and counted tabs.
  await contactsPage.openHarborRecord();
  await contactsPage.assertHarborRecord();

  // Step 2: select the real seeded layout, then check its fields at each breakpoint.
  await contactsPage.openHarborContactForm();
  for (const width of CONTACT_HARBOR.widths) {
    await contactsPage.assertHarborFormAtWidth(width);
  }

  // Step 3: invalid submission announces required errors, focuses name and sends no create.
  await contactsPage.observeContactCreation();
  await contactsPage.createContact();
  await contactsPage.assertRequiredErrorsAnnounced();
  expect(await contactsPage.getContactCreateRequestCount()).toBe(0);
});
