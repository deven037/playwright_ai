import { test, expect } from '@fixtures/CrmFixtures';
import { CONVERTED_SEARCH } from '../../../../src/data/leads.data';

test.use({ trace: 'on-first-retry' });

test('AIO-T100: Converted leads remain searchable in Leads list @regression', async ({
    crmLoginPage, dashboardPage, leadsPage,
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForPageLoad();
    await leadsPage.trackConvertedSearchRecords();
    await leadsPage.goToLeads();

    const wizardLead = await leadsPage.createConvertedSearchLead();
    await leadsPage.goToLeads();
    await leadsPage.searchInLeadsTable(wizardLead);
    await leadsPage.assertSearchLeadStatus(wizardLead, CONVERTED_SEARCH.newStatus);
    await leadsPage.openSearchLeadConversion(wizardLead);
    expect(await leadsPage.getWizardContactName()).toBe(wizardLead);
    await leadsPage.wizardNext();
    await leadsPage.nameSearchConversionAccount(wizardLead);
    await leadsPage.wizardNext();
    await leadsPage.nameSearchConversionDeal(wizardLead);
    await leadsPage.finishConversion();
    await leadsPage.assertConvertedToast(wizardLead);
    await leadsPage.searchInLeadsTable(wizardLead);
    await leadsPage.assertSearchLeadStatus(wizardLead, CONVERTED_SEARCH.convertedStatus);

    const editedLead = await leadsPage.createConvertedSearchLead();
    await leadsPage.goToLeads();
    await leadsPage.searchInLeadsTable(editedLead);
    await leadsPage.assertSearchLeadStatus(editedLead, CONVERTED_SEARCH.newStatus);
    await leadsPage.editSearchLeadToConverted(editedLead);
    await leadsPage.goToLeads();
    await leadsPage.searchInLeadsTable(editedLead);
    await leadsPage.assertSearchLeadStatus(editedLead, CONVERTED_SEARCH.convertedStatus);

    await leadsPage.assertConvertedSearchVariants(wizardLead);
    await leadsPage.assertConvertedSearchVariants(editedLead);
    await leadsPage.searchForMissingConvertedLead(editedLead);
    await leadsPage.assertClearingConvertedSearchRestoresList();
    await leadsPage.assertGlobalSearchExcludesConverted(wizardLead);
    await leadsPage.assertGlobalSearchExcludesConverted(editedLead);
});
