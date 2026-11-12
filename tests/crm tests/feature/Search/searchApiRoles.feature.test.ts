import { test } from '@fixtures/CrmFixtures';

// The AIO-T83 to AIO-T85 keys belong to the AIO-202 cases in searchApiContract.feature.test.ts.
test.describe('AIO-210 Global search by role (AIO-202 AC1-AC3)', () => {
    test('AIO-210 Admin search returns grouped results with per-type limit and totals @regression', async ({ searchPage }) => {
        await searchPage.signInAs('admin');
        await searchPage.assertGroupedResultsWithTotals();
    });

    test('AIO-210 Admin matches Email and formatted Phone @regression', async ({ searchPage }) => {
        await searchPage.signInAs('admin');
        await searchPage.assertContactDetailsReturnedAndMatched();
    });

    test('AIO-210 Sales rep gets Email/Phone and is matched by them @regression', async ({ searchPage }) => {
        await searchPage.signInAs('rep');
        await searchPage.assertContactDetailsReturnedAndMatched();
    });

    test('AIO-T161 Viewer without Email/Phone permission gets neither and is not matched by them @regression', async ({ searchPage }) => {
        await searchPage.signInAs('viewer');
        await searchPage.assertContactDetailsHiddenAndNotMatched();
    });
});
