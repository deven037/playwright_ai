import { expect, test } from "@fixtures/CrmFixtures";

const CUSTOM_STATUS = 'QA Custom';
const LEAD_STATUS_SET = 'Lead Status';

test.describe('Leads status filter reflects configured options (AIO-138 / AIO-61 AC4)', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage, leadsPage }) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForPageLoad();
        await dashboardPage.assertProfileIconVisible();
        await leadsPage.goToLeads();
    });

    test('AIO-T25: Leads status filter reflects configured Lead Status options @regression', async ({ page, leadsPage, adminPage }) => {
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
            await page.getByTestId('filters-toggle').click();
            const filterPanel = page.getByTestId('filter-panel');
            await expect(filterPanel).toBeVisible();
            await filterPanel.getByRole('button', { name: 'Any status' }).click();
            const options = page.getByRole('listbox').getByRole('option');
            await expect(options).toHaveCount(baseline.length + 1);
            await expect(options.filter({ hasText: CUSTOM_STATUS })).toHaveCount(1);
            for (const status of baseline) {
                await expect(options.filter({ hasText: status }).first()).toBeVisible();
            }
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
