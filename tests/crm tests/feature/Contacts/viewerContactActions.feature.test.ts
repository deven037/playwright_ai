import { test, expect } from '@fixtures/CrmFixtures';

test.use({ role: 'viewer', trace: 'retain-on-failure' });

test('AIO-T212: Viewer cannot Edit, Upload photo or Delete on contact record @regression', async ({ contactsPage }) => {
  // Step 1: the viewer session comes from global setup using the existing environment configuration.
  await contactsPage.openViewerContactRecord();
  await contactsPage.assertViewerContactRecordLoaded();

  // Step 2: each write control must be hidden (including absent) or disabled.
  await expect.poll(
    () => contactsPage.getAvailableContactWriteActions(),
    { message: 'Viewer has no visible, enabled Edit, Upload photo or Delete contact control' },
  ).toEqual([]);
});
