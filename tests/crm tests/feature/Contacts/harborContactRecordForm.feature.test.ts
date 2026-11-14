import { test, expect } from '@fixtures/CrmFixtures';

// AIO-T209: exercise an existing record and reject an empty create without changing data.
test('AIO-T209: Harbor contact record and selected form @regression', async ({
  page, crmLoginPage, dashboardPage, contactsPage,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await crmLoginPage.goto();
  await dashboardPage.waitForDashBoardPage();
  await contactsPage.gotoContacts();
  const recordLink = page.locator('main a[href^="/contacts/"]').filter({ hasText: 'View profile' }).first();
  await expect(recordLink).toBeVisible();
  await recordLink.click();

  const record = page.getByTestId('contact-detail-page');
  await expect(record.getByRole('heading', { level: 1 })).not.toBeEmpty();
  await expect(record.locator('.contact-record-avatar')).toBeVisible();
  for (const label of ['Email', 'Phone', 'Account', 'Created']) {
    await expect(record.getByText(label, { exact: true }).first()).toBeVisible();
  }
  const tabs = record.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await expect(record.getByRole('tab', { name: 'Overview', exact: true })).toBeVisible();
  await expect(record.getByRole('tab', { name: 'Activity', exact: true })).toBeVisible();
  await expect(record.getByRole('tab', { name: /^Notes \(\d+\)$/ })).toBeVisible();
  await expect(record.getByRole('tab', { name: /^Files \(\d+\)$/ })).toBeVisible();
  await record.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(record.getByRole('textbox', { name: /Created/i })).toHaveCount(0);
  await record.getByRole('button', { name: 'Cancel', exact: true }).click();
  await record.getByRole('link', { name: 'Contacts', exact: true }).click();

  await contactsPage.clickNewContact();
  await contactsPage.chooseLayout('Default');
  await contactsPage.assertAccessibleEmptyForm();
  const form = page.getByTestId('contact-form-page');
  await expect(form.getByText('Layout: Default', { exact: true })).toBeVisible();
  const name = form.getByTestId('contact-name');
  const email = form.getByTestId('contact-email');
  const desktopName = await name.boundingBox();
  const desktopEmail = await email.boundingBox();
  expect(desktopName).not.toBeNull();
  expect(desktopEmail).not.toBeNull();
  expect(Math.abs(desktopName!.y - desktopEmail!.y)).toBeLessThan(2);
  expect(desktopEmail!.x).toBeGreaterThan(desktopName!.x + desktopName!.width);

  await page.setViewportSize({ width: 375, height: 900 });
  const phoneName = await name.boundingBox();
  const phoneEmail = await email.boundingBox();
  expect(phoneName).not.toBeNull();
  expect(phoneEmail).not.toBeNull();
  expect(phoneEmail!.y).toBeGreaterThan(phoneName!.y + phoneName!.height);
  expect(Math.abs(phoneName!.x - phoneEmail!.x)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await contactsPage.observeContactCreation();
  await contactsPage.createContact();
  await contactsPage.assertEmptySubmitErrorsAndFocus();
  for (const error of ['Name is required.', 'Enter a valid email.']) {
    await expect(form.locator('[aria-live="polite"]').getByText(error, { exact: true })).toBeVisible();
  }
  expect(await contactsPage.getContactCreateRequestCount()).toBe(0);
});
