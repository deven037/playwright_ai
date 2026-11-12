import { expect, test } from "@fixtures/CrmFixtures";

test('@e2e @smoke @regression Verify new lead creation - Should create a new lead successfully', async ({ crmLoginPage, dashboardPage, leadsPage }) => {

    await crmLoginPage.goto();

    await dashboardPage.waitForDashBoardPage();
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
});
