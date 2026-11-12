import { expect, test } from "@fixtures/CrmFixtures";

test('@regression Convert a lead through the 3-step wizard with a new account and a deal', async ({
    crmLoginPage,
    dashboardPage,
    leadsPage }) => {

    await crmLoginPage.goto();

    await dashboardPage.waitForPageLoad();
    await dashboardPage.assertProfileIconVisible();

    await leadsPage.goToLeads();
    await leadsPage.createNewLead();
    await leadsPage.chooseLayout('Default');
    await leadsPage.fillLeadDetails('New', 'Event', 3000, 'CRM Starter Plan');
    await leadsPage.createLead();

    const leadName = await leadsPage.getLeadNameFromDetailsPage();
    await leadsPage.goToLeads();
    await leadsPage.searchInLeadsTable(leadName);
    expect(await leadsPage.getFirstLeadNameFromTable()).toBe(leadName);

    await leadsPage.openConvertWizardForFirstLead();
    expect(await leadsPage.getWizardContactName()).toBe(leadName);
    await leadsPage.wizardNext();
    await leadsPage.setWizardAccountName(`Account_${Date.now()}`);
    await leadsPage.wizardNext();
    await leadsPage.enableWizardDeal(`Deal_${Date.now()}`);
    await leadsPage.finishConversion();

    await leadsPage.assertConvertedToast(leadName);
    await leadsPage.searchInLeadsTable(leadName);
    expect(await leadsPage.getStatusFromTable()).toBe('Converted');
});
