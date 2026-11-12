import { expect, test } from "@fixtures/CrmFixtures";

test('@regression Perform actions save, edit and delete on lead after creation ', async ({ 
    crmLoginPage, 
    dashboardPage, 
    leadsPage }) => {

    await crmLoginPage.goto();

    await dashboardPage.waitForPageLoad();
    await dashboardPage.assertProfileIconVisible();

    await leadsPage.goToLeads();
    const currentUrl = await leadsPage.getPageUrl();
    expect(currentUrl).toContain('/leads');

    await leadsPage.createNewLead();
    await leadsPage.chooseLayout('Default');
    await leadsPage.fillLeadDetails('New', 'Event', 3000, 'CRM Starter Plan');
    await leadsPage.createLead();

    const leadName = await leadsPage.getLeadNameFromDetailsPage();
    await leadsPage.goToLeads();
    await leadsPage.searchInLeadsTable(leadName);

    expect(await leadsPage.getFirstLeadNameFromTable()).toBe(leadName);

    await leadsPage.clickLeadName();
    await leadsPage.editlead();
    await leadsPage.editStatusCode('Converted');
    await leadsPage.editSource('Web');
    await leadsPage.editLeadValue(4000);
    await leadsPage.editProduct(5);
    await leadsPage.createLead();

    const updatedSource = await leadsPage.getTextOfUpdatedField(4);
    const updatedLeadValue = await leadsPage.getTextOfUpdatedField(6);
    const statusOndetailPage = await leadsPage.getLeadStatus();

    await leadsPage.goToLeads();
    await leadsPage.searchInLeadsTable(leadName);

    expect(await leadsPage.getStatusFromTable()).toBe(statusOndetailPage);
    expect(await leadsPage.getTextFromLeadTableColumns(7)).toBe(updatedSource);
    expect(await leadsPage.getTextFromLeadTableColumns(9)).toBe(updatedLeadValue);

    await leadsPage.clickLeadName();
    await leadsPage.deleteLead();
    await leadsPage.confirmDelete(true);

    await leadsPage.searchInLeadsTable(leadName, false);
    await leadsPage.assertSearchedLeadAbsent();
});
