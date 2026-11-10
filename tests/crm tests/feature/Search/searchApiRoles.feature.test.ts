import { test } from '@fixtures/CrmFixtures';

test.describe('AIO-210 Global search by role (AIO-202 AC1-AC4)', () => {
    test('AIO-T83 Admin search returns grouped results with per-type limit and totals @regression', async ({ searchPage }) => {
        await searchPage.signInAs('admin');
        await searchPage.assertGroupedResultsWithTotals();
    });

    test('AIO-T84 Admin matches Email and formatted Phone @regression', async ({ searchPage }) => {
        await searchPage.signInAs('admin');
        await searchPage.assertContactDetailsReturnedAndMatched();
    });

    test('AIO-T85 Sales rep gets Email/Phone and is matched by them @regression', async ({ searchPage }) => {
        await searchPage.signInAs('rep');
        await searchPage.assertContactDetailsReturnedAndMatched();
    });

    test('AIO-T86 Viewer without Email/Phone permission gets neither and is not matched by them @regression', async ({ searchPage }) => {
        await searchPage.signInAs('viewer');
        await searchPage.assertContactDetailsHiddenAndNotMatched();
    });
});
