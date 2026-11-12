import { test } from '@fixtures/CrmFixtures';
import {
    SEEDED_LEAD_COUNT,
    LEADS_PAGE_SIZE,
    PAGE_BUTTON_WINDOW_SIZE,
    NO_MATCH_SEARCH_TEXT,
    NO_MATCH_MESSAGE,
} from '../../../../src/data/leads.data';

test.describe('AIO-T101: Leads pagination', () => {
    test('AIO-T101: seeded leads, reach every page, filter-empty state @regression', async ({ crmLoginPage, leadsPage }) => {
        await crmLoginPage.goto();
        await leadsPage.goToLeads();
        await leadsPage.assertLeadsTableLoaded();

        const total = await leadsPage.getLeadsTotal();
        await leadsPage.assertLeadsTotalAtLeast(total, SEEDED_LEAD_COUNT);
        const totalPages = Math.ceil(total / LEADS_PAGE_SIZE);
        const lastPageRows = total - (totalPages - 1) * LEADS_PAGE_SIZE;
        await leadsPage.assertPaginationFooter(total, 1, totalPages);

        await leadsPage.goToNextLeadsPage(totalPages - 1);
        await leadsPage.assertPaginationFooter(total, totalPages, totalPages);
        await leadsPage.assertNextPageDisabled();
        await leadsPage.assertLeadRowCount(lastPageRows);
        await leadsPage.assertPageButtonWindow(totalPages - PAGE_BUTTON_WINDOW_SIZE + 1, totalPages);

        await leadsPage.searchLeadsList(NO_MATCH_SEARCH_TEXT);
        await leadsPage.assertEmptyLeadsMessage(NO_MATCH_MESSAGE);
    });
});
