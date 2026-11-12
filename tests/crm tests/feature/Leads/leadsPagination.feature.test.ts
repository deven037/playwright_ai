import { test } from '@fixtures/CrmFixtures';
import {
    SEEDED_LEAD_COUNT,
    LEADS_TOTAL_PAGES,
    LEADS_LAST_PAGE_ROWS,
    NO_MATCH_SEARCH_TEXT,
    NO_MATCH_MESSAGE,
} from '../../../../src/data/leads.data';

test.describe('AIO-T101: Leads pagination', () => {
    test('AIO-T101: 75 seeded leads, reach every page, filter-empty state @regression', async ({ crmLoginPage, leadsPage }) => {
        await crmLoginPage.goto();
        await leadsPage.goToLeads();
        await leadsPage.assertLeadsTableLoaded();
        await leadsPage.assertPaginationFooter(SEEDED_LEAD_COUNT, 1, LEADS_TOTAL_PAGES);

        await leadsPage.goToNextLeadsPage(LEADS_TOTAL_PAGES - 1);
        await leadsPage.assertPaginationFooter(SEEDED_LEAD_COUNT, LEADS_TOTAL_PAGES, LEADS_TOTAL_PAGES);
        await leadsPage.assertNextPageDisabled();
        await leadsPage.assertLeadRowCount(LEADS_LAST_PAGE_ROWS);
        await leadsPage.assertPageButtonWindow(2, LEADS_TOTAL_PAGES);

        await leadsPage.searchLeadsList(NO_MATCH_SEARCH_TEXT);
        await leadsPage.assertEmptyLeadsMessage(NO_MATCH_MESSAGE);
    });
});
