import { expect, test } from "@fixtures/CrmFixtures";

test('AIO-T120: Admin can open conversion from a non-converted lead record @smoke @regression', async ({
    crmLoginPage,
    dashboardPage,
    leadsPage,
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForPageLoad();
    await dashboardPage.assertProfileIconVisible();

    await leadsPage.goToLeads();
    const lead = await leadsPage.openFirstNonConvertedLead();
    expect(lead.status).not.toBe('Converted');
    expect(await leadsPage.getLeadStatus()).toBe(lead.status);

    expect(await leadsPage.isConvertLeadActionVisible()).toBe(true);
    expect(await leadsPage.isConvertLeadActionKeyboardReachable()).toBe(true);

    await leadsPage.openConvertWizardFromLeadRecord();
    expect(await leadsPage.isConversionWizardAtStepOne()).toBe(true);

    await leadsPage.closeConversionWizard();
    expect(await leadsPage.isConversionWizardAtStepOne()).toBe(false);
    expect(await leadsPage.getLeadStatus()).toBe(lead.status);
});
