import { expect, test } from "@fixtures/CrmFixtures";
import { CUSTOM_STATUS, LEAD_STATUS_SET } from '../../../../src/data/leadStatus.data';

test.describe('Leads status filter reflects configured options (AIO-138 / AIO-61 AC4)', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage, leadsPage }) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForPageLoad();
        await dashboardPage.assertProfileIconVisible();
        await leadsPage.goToLeads();
    });

    test('AIO-T25: Leads status filter reflects configured Lead Status options @regression', async ({ leadsPage, adminPage }) => {
        let baseline: string[] = [];
        let added = false;

        try {
            // Step 1: add 'QA Custom' to Lead Status and save
            await adminPage.gotoStatusCodesFromLeads();
            baseline = await adminPage.openStatusSet(LEAD_STATUS_SET);
            expect(baseline, 'the picklist does not already contain the custom option').not.toContain(CUSTOM_STATUS);
            await adminPage.saveStatusSet([...baseline, CUSTOM_STATUS]);
            added = true;
            await expect(adminPage.statusSetMeta(LEAD_STATUS_SET)).toContainText(`${baseline.length + 1} option(s)`);

            // Step 2: Leads > Filters > Status lists the configured options including 'QA Custom'
            await leadsPage.goToLeads();
            await leadsPage.openStatusFilter();
            await leadsPage.assertStatusFilterOptions(baseline, CUSTOM_STATUS);
        } finally {
            // Step 3 (cleanup): remove 'QA Custom' so Lead Status is back to its baseline
            if (added) {
                await leadsPage.goToLeads();
                await adminPage.gotoStatusCodesFromLeads();
                const current = await adminPage.openStatusSet(LEAD_STATUS_SET);
                await adminPage.saveStatusSet(current.filter((o) => o !== CUSTOM_STATUS));
                await expect(adminPage.statusSetMeta(LEAD_STATUS_SET)).toContainText(`${baseline.length} option(s)`);
            }
        }
    });
});
