import { test } from "@fixtures/CrmFixtures";

test('@regression Verify Lead Assignment Rule Creation', async({
    crmLoginPage,
    dashboardPage,
    leadsPage,
    assignmentRulesPage
}) => {

    await crmLoginPage.goto();

    await dashboardPage.waitForDashBoardPage();
    await dashboardPage.assertProfileIconVisible();

    await leadsPage.goToLeads();
    await assignmentRulesPage.gotoAssignmentRules();
    await assignmentRulesPage.clickNewAssignmentRule();

    const cretedRule = await assignmentRulesPage.fillAssignmentRuleDetails('Lead', 'Riya Rep', true, [{field: 'Name', value:'Test'}]);
    await assignmentRulesPage.saveRule();

    await assignmentRulesPage.verifyRuleCreated(cretedRule.rule);
})