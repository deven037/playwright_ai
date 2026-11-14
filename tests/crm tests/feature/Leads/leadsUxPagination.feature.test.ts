import { test, expect } from '@fixtures/CrmFixtures';
import { NO_MATCH_SEARCH_TEXT, NO_MATCH_MESSAGE, NO_LEADS_MESSAGE } from '../../../../src/data/leads.data';

test.describe.configure({ retries: 0 });

test.use({ trace: 'on-first-retry' });

test('AIO-T16: every numbered page, filter reset and distinct empty states @regression', async ({ crmLoginPage, leadsPage }) => {
    await leadsPage.mockUxLeads();
    await crmLoginPage.goto();
    await leadsPage.goToLeads();
    await leadsPage.assertPaginationFooter(80, 1, 8);
    await leadsPage.goToNumberedPage(7);
    await leadsPage.goToNumberedPage(8);
    await leadsPage.assertPaginationFooter(80, 8, 8);
    await leadsPage.assertNextPageDisabled();
    await leadsPage.goToNumberedPage(4);
    await leadsPage.goToNumberedPage(1);
    await leadsPage.goToNumberedPage(2);
    await leadsPage.goToNumberedPage(3);
    await leadsPage.goToNumberedPage(4);
    await leadsPage.goToNumberedPage(5);
    await leadsPage.goToNumberedPage(6);
    await leadsPage.goToNumberedPage(8);
    await leadsPage.chooseStatus('New');
    await leadsPage.clearListFilters();
    await leadsPage.assertPaginationFooter(80, 1, 8);
    await leadsPage.searchLeadsList(NO_MATCH_SEARCH_TEXT);
    await leadsPage.assertEmptyLeadsMessage(NO_MATCH_MESSAGE);
    await leadsPage.mockUxLeads(true);
    await crmLoginPage.goto();
    await leadsPage.goToLeads();
    await leadsPage.assertEmptyLeadsMessage(NO_LEADS_MESSAGE);
});
