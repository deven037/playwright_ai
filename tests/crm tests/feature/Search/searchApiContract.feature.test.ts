import { test } from '@fixtures/CrmFixtures';

test.describe('AIO-202 Global search – Search API', () => {
    test('AIO-T83: Search returns grouped results with per-type limit and totals (AC1) @smoke', async ({ searchApiPage }) => {
        await searchApiPage.assertGroupedResultsLimitAndErrors();
    });

    test('AIO-T84: Matching on name, company, email and phone; phone ignores spaces, dashes, brackets (AC2) @regression', async ({ searchApiPage }) => {
        await searchApiPage.assertNameCompanyEmailAndPhoneMatching();
    });

    test('AIO-T85: Viewer gets no Email/Phone and is not matched by them; Admin and Rep do (AC3, AC4) @regression', async ({ searchApiPage }) => {
        await searchApiPage.assertRoleVisibilityOfEmailAndPhone();
    });

    test('AIO-T86: Invalid or too-short terms return defined errors (AC6) @regression', async ({ searchApiPage }) => {
        await searchApiPage.assertInvalidTermsReturnDefinedErrors();
    });

    test('AIO-T87: p95 of search under 1 s on staging (AC5) @regression', async ({ searchApiPage }) => {
        await searchApiPage.assertP95UnderLimit();
    });
});
