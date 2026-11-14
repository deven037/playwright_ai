import { test, expect } from '@fixtures/CrmFixtures';
import { CONVERTED_LEAD_STATUS, NON_CONVERTED_LEAD_STATUS } from '../../../../src/data/leads.data';

test.use({ role: 'admin', trace: 'retain-on-failure' });
test.describe.configure({ retries: 0 });

test('AIO-T203: Convert is blocked for a Converted lead @regression', async ({
    crmLoginPage, dashboardPage, leadsPage,
}) => {
    await crmLoginPage.goto();
    await dashboardPage.waitForPageLoad();
    await dashboardPage.assertProfileIconVisible();
    await leadsPage.goToLeads();
    await leadsPage.createNewLead();
    await leadsPage.chooseLayout('Default');
    await leadsPage.fillLeadDetails(NON_CONVERTED_LEAD_STATUS, 'Event', 3000);
    await leadsPage.createLead();
    const leadName = await leadsPage.getLeadNameFromDetailsPage();
    await leadsPage.goToLeads();
    await leadsPage.searchInLeadsTable(leadName);

    await leadsPage.assertNamedLeadStatus(leadName, NON_CONVERTED_LEAD_STATUS);
    await leadsPage.openConversionForLead(leadName);
    await leadsPage.assertConversionWizardStepOne();
    expect(await leadsPage.getWizardContactName()).toBe(leadName);
    await leadsPage.closeConversionWizard();
    await leadsPage.assertConversionWizardClosed();

    await leadsPage.openConversionForLead(leadName);
    await leadsPage.wizardNext();
    await leadsPage.wizardNext();
    await leadsPage.finishConversion();
    await leadsPage.assertConvertedToast(leadName);
    await leadsPage.assertNamedLeadStatus(leadName, CONVERTED_LEAD_STATUS);
    await leadsPage.assertConvertedRowCannotOpenWizard(leadName);
    await leadsPage.assertConvertedContextMenuBlocked(leadName);
});
