import { test } from '@fixtures/CrmFixtures';

test.describe('AIO-T136: Viewer contact columns', () => {
    test.use({ role: 'viewer' });
    test('AIO-T136: Viewer sees no Email/Phone column or value @regression', async ({ crmLoginPage, leadsPage }) => {
        await crmLoginPage.goto();
        await leadsPage.goToLeads();
        await leadsPage.assertLeadsTableLoaded();
        await leadsPage.assertViewerContactFieldsHidden();
    });
});

for (const role of ['admin', 'rep'] as const) {
    test.describe(`AIO-T137: ${role} contact columns`, () => {
        test.use({ role });
        test(`AIO-T137: ${role} sees Email and Phone with values @regression`, async ({ crmLoginPage, leadsPage }) => {
            await crmLoginPage.goto();
            await leadsPage.goToLeads();
            await leadsPage.assertLeadsTableLoaded();
            await leadsPage.assertContactFieldsVisible();
        });
    });
}
