import { expect, test } from "@fixtures/CrmFixtures";

test('@sanity Verify new lead creation - Should create a new lead successfully', async ({ crmLoginPage, dashboardPage, leadsPage }) => {

    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();

    await dashboardPage.waitForPageLoad();
    await dashboardPage.assertProfileIconVisible();

    await leadsPage.goToLeads();
    const currentUrl = await leadsPage.getPageUrl();
    expect(currentUrl).toContain('/leads');

    await leadsPage.createNewLead();
    await leadsPage.fillLeadDetails('New', 'Event', 'CRM Starter Plan', 3000);

    const leadName = await leadsPage.getLeadNameFromDetailsPage();
    await leadsPage.goToLeads();
    await leadsPage.searchInLeadsTable(leadName);

    expect(await leadsPage.getFirstLeadNameFromTable()).toBe(leadName);
});