import { test } from "@fixtures/CrmFixtures";

test('@regression Verify Deals Assignment Rule Creation', async({
    crmLoginPage,
    dashboardPage,
    dealsPage,
    assignmentRulesPage
}) => {

    await crmLoginPage.goto();

    await dashboardPage.waitForDashBoardPage();
    await dashboardPage.assertProfileIconVisible();

    await dealsPage.gotoDeals();
    await assignmentRulesPage.gotoAssignmentRules();
    await assignmentRulesPage.clickNewAssignmentRule();

    const cretedRule = await assignmentRulesPage.fillAssignmentRuleDetails('Deals', 'Riya Rep', true, [{field: 'Name', value:'Test'}], 'Deals');
    await assignmentRulesPage.saveRule();

    await assignmentRulesPage.verifyRuleCreated(cretedRule.rule);
})