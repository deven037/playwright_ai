import { test, expect } from '@fixtures/CrmFixtures';
import { UX_LEADS, UX_VALID_CONTACT, UX_INVALID_EMAIL, NO_MATCH_SEARCH_TEXT, NO_MATCH_MESSAGE } from '../../../../src/data/leads.data';

test.describe.configure({ retries: 0 });

test.use({ trace: 'on-first-retry' });

test('AIO-T13: selection resets and conversion validates and submits once @regression', async ({ crmLoginPage, leadsPage }) => {
    await leadsPage.mockUxLeads();
    await leadsPage.mockConversionWrites();
    await crmLoginPage.goto();
    await leadsPage.goToLeads();
    await leadsPage.assertLeadRowCount(10);
    await leadsPage.selectFirstTwoLeads();
    await leadsPage.chooseStatus('New');
    await leadsPage.assertSelectionCleared();
    await leadsPage.selectFirstTwoLeads();
    await leadsPage.goToNumberedPage(2);
    await leadsPage.assertSelectionCleared();
    await leadsPage.selectFirstTwoLeads();
    await leadsPage.searchLeadsList(NO_MATCH_SEARCH_TEXT);
    await leadsPage.assertEmptyLeadsMessage(NO_MATCH_MESSAGE);
    await leadsPage.assertSelectionCleared();
    await leadsPage.searchLeadsList('');
    await leadsPage.assertLeadRowCount(10);
    await leadsPage.selectFirstTwoLeads();
    await leadsPage.openConversionForLead(UX_LEADS[0].name);
    await leadsPage.setConversionContact('', UX_VALID_CONTACT.email);
    await leadsPage.wizardNext();
    await leadsPage.assertConversionValidation('name');
    await leadsPage.setConversionContact(UX_VALID_CONTACT.name, UX_INVALID_EMAIL);
    await leadsPage.wizardNext();
    await leadsPage.assertConversionValidation('email');
    await leadsPage.setConversionContact(UX_VALID_CONTACT.name, UX_VALID_CONTACT.email);
    expect(await leadsPage.getWizardContactName()).toBe(UX_VALID_CONTACT.name);
    await leadsPage.wizardNext();
    await leadsPage.setWizardAccountName(UX_VALID_CONTACT.account);
    await leadsPage.wizardNext();
    await leadsPage.finishConversionTwice();
    await leadsPage.assertConvertedToast(UX_LEADS[0].name);
    await leadsPage.assertSingleConversion();
});
