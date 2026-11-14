import { test, expect } from '@fixtures/CrmFixtures';

test.describe.configure({ retries: 0 });

test.use({ role: 'viewer', trace: 'on-first-retry' });

test('AIO-T15: configured custom statuses and Viewer export and field permissions @regression', async ({ crmLoginPage, leadsPage }) => {
    await leadsPage.mockConfiguredStatuses();
    await crmLoginPage.goto();
    await leadsPage.goToLeads();
    await leadsPage.assertLeadsTableLoaded();
    await leadsPage.openStatusFilter();
    await leadsPage.assertConfiguredStatusOptions();
    await leadsPage.assertExportUnavailable();
    await leadsPage.assertViewerContactFieldsHidden();
});
