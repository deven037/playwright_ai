import { expect, test } from "@fixtures/CrmFixtures";

test('Verify Lead Assignment Rule Creation', async({
    crmLoginPage,
    dashboardPage,
    leadsPage,
    assignmentRulesPage
}) => {

    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();

    await dashboardPage.waitForDashBoardPage();
    await dashboardPage.assertProfileIconVisible();

    await leadsPage.goToLeads();
    await assignmentRulesPage.gotoAssignmentRules();
    await assignmentRulesPage.clickNewAssignmentRule();

    const cretedRule = await assignmentRulesPage.fillAssignmentRuleDetails('Lead', 'Riya Rep', true, [{field: 'Layout', value:'Default'}, {field: 'Status', value: 'Converted'}], 'Leads');
    await assignmentRulesPage.saveRule();

    await assignmentRulesPage.verifyRuleCreated(cretedRule.rule);

    await leadsPage.goToLeads();
    
    await leadsPage.createNewLead();
    await leadsPage.chooseLayout('Default');
    await leadsPage.fillLeadDetails('New', 'Event', 3000, 'CRM Starter Plan');
    await leadsPage.createLead();
    
    const leadName = await leadsPage.getLeadNameFromDetailsPage();
    const owner = await leadsPage.getLeadAssignTo();
    expect(owner).not.toBe(cretedRule.assignToUser);

    await leadsPage.goToLeads();
    await leadsPage.searchInLeadsTable(leadName);
    
    expect(await leadsPage.getFirstLeadNameFromTable()).toBe(leadName);
    await leadsPage.clickLeadName();
    await leadsPage.editlead();
    await leadsPage.editStatusCode('Converted');
    await leadsPage.createLead();

    const assignedOwner = await leadsPage.getLeadAssignTo();
    expect(assignedOwner).toBe(cretedRule.assignToUser);
})