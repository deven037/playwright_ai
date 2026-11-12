import { test, expect } from '@fixtures/CrmFixtures';
import { CONVERTED_LEAD_STATUS, NON_CONVERTED_LEAD_STATUS } from '@data/leads.data';

test.use({ role: 'admin', trace: 'retain-on-failure' });
test.describe.configure({ retries: 0 });

test('AIO-T203: Convert is blocked for a Converted lead @regression', async ({
    crmLoginPage, dashboardPage, leadsPage,
}) => {
    await crmLoginPage.goto();
    await dashboardPage.waitForPageLoad();
    await dashboardPage.assertProfileIconVisible();
    await leadsPage.goToLeads();

    await leadsPage.filterLeadsByStatus(CONVERTED_LEAD_STATUS);
    await leadsPage.assertConvertedRowCannotOpenWizard();
    await leadsPage.assertConvertedContextMenuBlocked();

    await leadsPage.clearLeadStatusFilters();
    await leadsPage.filterLeadsByStatus(NON_CONVERTED_LEAD_STATUS);
    await leadsPage.openConversionForStatus(NON_CONVERTED_LEAD_STATUS);
    await leadsPage.assertConversionWizardStepOne();
    expect(await leadsPage.getWizardContactName()).not.toBe('');
    await leadsPage.closeConversionWizard();
    await leadsPage.assertConversionWizardClosed();
});
