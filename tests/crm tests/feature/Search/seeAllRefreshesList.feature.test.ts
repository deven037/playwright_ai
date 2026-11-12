import { test, expect } from '@fixtures/CrmFixtures';
import { SEARCH_TERMS } from '../../../../src/data/search.data';

test.describe('AIO-220 See all same-route refresh', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage, searchPage }) => {
        await searchPage.installFixtures();
        await crmLoginPage.goto();
        await dashboardPage.waitForDashBoardPage();
        await searchPage.openList('leads');
    });

    test('AIO-T89 Leads second See all refreshes URL, box and rows @smoke @regression', async ({ searchPage }) => {
        await searchPage.seeAll(SEARCH_TERMS.first, 'leads');
        await searchPage.assertList('leads', SEARCH_TERMS.first);
        await searchPage.seeAll(SEARCH_TERMS.second, 'leads');
        await searchPage.assertList('leads', SEARCH_TERMS.second);
    });

    test('AIO-T90 See all resets page 2 to page 1 @regression', async ({ searchPage }) => {
        await searchPage.goToSecondPage();
        await searchPage.seeAll(SEARCH_TERMS.first, 'leads');
        await searchPage.assertList('leads', SEARCH_TERMS.first);
    });

    test('AIO-T91 Contacts and Accounts second See all refreshes filter @regression', async ({ searchPage }) => {
        await searchPage.openList('contacts');
        await searchPage.seeAll(SEARCH_TERMS.first, 'contacts');
        await searchPage.assertList('contacts', SEARCH_TERMS.first);
        await searchPage.seeAll(SEARCH_TERMS.second, 'contacts');
        await searchPage.assertList('contacts', SEARCH_TERMS.second);
        await searchPage.openList('accounts');
        await searchPage.seeAll(SEARCH_TERMS.first, 'accounts');
        await searchPage.assertList('accounts', SEARCH_TERMS.first);
        await searchPage.seeAll(SEARCH_TERMS.second, 'accounts');
        await searchPage.assertList('accounts', SEARCH_TERMS.second);
    });

    test('AIO-T92 Enter ignores pending debounce and held current response @regression', async ({ searchPage }) => {
        await searchPage.assertEnterWaitsForCurrentResults();
    });

    test('AIO-T93 Same-term See all resets an edited list box @regression', async ({ searchPage }) => {
        await searchPage.seeAll(SEARCH_TERMS.first, 'leads');
        await searchPage.assertList('leads', SEARCH_TERMS.first);
        await searchPage.editListToNoMatches('leads');
        await searchPage.seeAll(SEARCH_TERMS.first, 'leads');
        await searchPage.assertList('leads', SEARCH_TERMS.first);
        await searchPage.openList('contacts');
        await searchPage.seeAll(SEARCH_TERMS.first, 'contacts');
        await searchPage.assertList('contacts', SEARCH_TERMS.first);
        await searchPage.editListToNoMatches('contacts');
        await searchPage.seeAll(SEARCH_TERMS.first, 'contacts');
        await searchPage.assertList('contacts', SEARCH_TERMS.first);
        await searchPage.openList('accounts');
        await searchPage.seeAll(SEARCH_TERMS.first, 'accounts');
        await searchPage.assertList('accounts', SEARCH_TERMS.first);
        await searchPage.editListToNoMatches('accounts');
        await searchPage.seeAll(SEARCH_TERMS.first, 'accounts');
        await searchPage.assertList('accounts', SEARCH_TERMS.first);
    });
});
