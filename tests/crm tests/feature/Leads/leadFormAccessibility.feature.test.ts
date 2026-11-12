import { test, expect } from '@fixtures/CrmFixtures';
import { LEAD_FORM_ACCESSIBILITY } from '../../../../src/data/leads.data';

test.use({ role: 'admin', trace: 'on-first-retry' });

test('AIO-T204: Lead form labels, invalid email and Status options @regression', async ({
    crmLoginPage,
    dashboardPage,
    leadsPage,
}) => {
    await crmLoginPage.goto();
    await dashboardPage.waitForDashBoardPage();
    await leadsPage.goToLeads();
    await leadsPage.createNewLead();
    await leadsPage.chooseLayout('Default');
    await leadsPage.assertLeadFormLabelAssociations();

    await leadsPage.fillInvalidLeadEmail(
        LEAD_FORM_ACCESSIBILITY.fullName,
        LEAD_FORM_ACCESSIBILITY.invalidEmail,
    );
    await leadsPage.submitNewLeadForm();
    await leadsPage.assertInvalidLeadEmailRejected();
    expect(await leadsPage.getPageUrl()).toMatch(/\/leads\/new(?:\?.*)?$/);

    await leadsPage.openLeadFormStatus();
    await leadsPage.assertLeadFormStatusOptions();
});
