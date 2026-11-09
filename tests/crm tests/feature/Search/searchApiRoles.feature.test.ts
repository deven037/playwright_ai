import { test } from '@fixtures/CrmFixtures';
import { SEARCH_ROLE_EMAILS, SearchRole } from '../../../../src/data/search.data';

test.describe('AIO-210 Global search by role (AIO-202 AC1-AC4)', () => {
    const signInAs = async (role: SearchRole, { crmLoginPage, dashboardPage }: any) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithCustomCredentials(SEARCH_ROLE_EMAILS[role]);
        await dashboardPage.waitForDashBoardPage();
    };

    test('AIO-T83 Admin search returns grouped results with per-type limit and totals @regression', async ({ crmLoginPage, dashboardPage, searchPage }) => {
        await signInAs('admin', { crmLoginPage, dashboardPage });
        await searchPage.assertGroupedResultsWithTotals();
    });

    test('AIO-T84 Admin matches Email and formatted Phone @regression', async ({ crmLoginPage, dashboardPage, searchPage }) => {
        await signInAs('admin', { crmLoginPage, dashboardPage });
        await searchPage.assertContactDetailsReturnedAndMatched();
    });

    test('AIO-T85 Sales rep gets Email/Phone and is matched by them @regression', async ({ crmLoginPage, dashboardPage, searchPage }) => {
        await signInAs('rep', { crmLoginPage, dashboardPage });
        await searchPage.assertContactDetailsReturnedAndMatched();
    });

    test('AIO-T85 Viewer without Email/Phone permission gets neither and is not matched by them @regression', async ({ crmLoginPage, dashboardPage, searchPage }) => {
        await signInAs('viewer', { crmLoginPage, dashboardPage });
        await searchPage.assertContactDetailsHiddenAndNotMatched();
    });
});
