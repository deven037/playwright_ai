import { expect, test } from "@fixtures/CrmFixtures";

test('AIO-T120: Admin can open conversion from a non-converted lead record @smoke @regression', async ({
    crmLoginPage,
    dashboardPage,
    leadsPage,
}) => {
    await crmLoginPage.goto();
    await dashboardPage.waitForPageLoad();
    await dashboardPage.assertProfileIconVisible();

    await leadsPage.goToLeads();
    const lead = await leadsPage.openFirstNonConvertedLead();
    expect(lead.status).not.toBe('Converted');
    expect(await leadsPage.getLeadStatus()).toBe(lead.status);

    await leadsPage.assertConvertLeadActionVisible();
    await leadsPage.assertConvertLeadActionKeyboardReachable();

    await leadsPage.openConvertWizardFromLeadRecord();
    await leadsPage.assertConversionWizardStepOne();

    await leadsPage.closeConversionWizard();
    await leadsPage.assertConversionWizardClosed();
    expect(await leadsPage.getLeadStatus()).toBe(lead.status);
});
