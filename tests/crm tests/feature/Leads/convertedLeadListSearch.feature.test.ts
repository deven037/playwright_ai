import { test } from '@fixtures/CrmFixtures';
import { LEADS_NO_MATCH_QUERY, LEAD_STATUS_CONVERTED } from '../../../../src/data/leads.data';

test('AIO-T100: Converted leads remain searchable in Leads list @regression', async ({
    crmLoginPage,
    dashboardPage,
    leadsPage,
    searchPage }) => {

    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForPageLoad();

    // Step 1: create a lead and convert it through the wizard
    await leadsPage.goToLeads();
    await leadsPage.createNewLead();
    await leadsPage.chooseLayout('Default');
    await leadsPage.fillLeadDetails('New', 'Event', 3000, 'CRM Starter Plan');
    await leadsPage.createLead();
    const wizardLead = await leadsPage.getLeadNameFromDetailsPage();

    await leadsPage.goToLeads();
    await leadsPage.searchInLeadsTable(wizardLead);
    await leadsPage.openConvertWizardForFirstLead();
    await leadsPage.wizardNext();
    await leadsPage.setWizardAccountName(`Account_${Date.now()}`);
    await leadsPage.wizardNext();
    await leadsPage.finishConversion();
    await leadsPage.assertConvertedToast(wizardLead);

    // Step 2: the converted lead is found by name in the list box
    await leadsPage.searchInLeadsTable(wizardLead);
    await leadsPage.assertLeadStatusInList(wizardLead, LEAD_STATUS_CONVERTED);

    // Step 3: a lead edited to Converted is found too
    await leadsPage.goToLeads();
    await leadsPage.createNewLead();
    await leadsPage.chooseLayout('Default');
    await leadsPage.fillLeadDetails('New', 'Event', 3000, 'CRM Starter Plan');
    await leadsPage.createLead();
    const editedLead = await leadsPage.getLeadNameFromDetailsPage();
    await leadsPage.editlead();
    await leadsPage.editStatusCode(LEAD_STATUS_CONVERTED);
    await leadsPage.createLead();

    await leadsPage.goToLeads();
    await leadsPage.searchInLeadsTable(editedLead);
    await leadsPage.assertLeadStatusInList(editedLead, LEAD_STATUS_CONVERTED);

    // Step 4: partial, case-insensitive, unmatched, cleared, and global header search
    await leadsPage.searchInLeadsTable(wizardLead.slice(5));
    await leadsPage.assertLeadStatusInList(wizardLead, LEAD_STATUS_CONVERTED);
    await leadsPage.searchInLeadsTable(wizardLead.toUpperCase());
    await leadsPage.assertLeadStatusInList(wizardLead, LEAD_STATUS_CONVERTED);
    await leadsPage.searchInLeadsTable(LEADS_NO_MATCH_QUERY);
    await leadsPage.assertNoLeadsMatch();
    await leadsPage.clearLeadsSearch();
    await searchPage.assertGlobalSearchExcludesLead(wizardLead);
});
