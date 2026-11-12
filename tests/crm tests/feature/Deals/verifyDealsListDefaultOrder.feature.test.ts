import { expect, test } from "@fixtures/CrmFixtures";

test.describe('Deals list default order (AIO-153 AC3, AIO-393)', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage }) => {
        await crmLoginPage.goto();
        await dashboardPage.waitForDashBoardPage();
        await dashboardPage.assertProfileIconVisible();
    });

    test('@regression AIO-T196: Deals list default order is newest first', async ({ dealsPage }) => {
        await dealsPage.gotoDealsList();

        // No header shows an active sort the user did not choose
        await dealsPage.assertNoActiveSortHeader();

        // The initial order is not amount-descending
        const amounts = await dealsPage.getListAmounts();
        const descending = [...amounts].sort((a, b) => b - a);
        expect(amounts).not.toEqual(descending);

        // Header click sort still works
        await dealsPage.clickAmountHeader();
        await dealsPage.assertAmountHeaderSort('descending');
    });
});
