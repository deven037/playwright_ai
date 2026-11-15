import { test } from '@fixtures/CrmFixtures';
import {
    BULK_ACTIONS, HARBOR_LIST_METRICS, LEAD_RECORD_PATH, NEW_LEAD_PATH,
} from '../../../../src/data/leadsHarbor.data';

test.describe('Leads Harbor parity and role access (AIO-411)', () => {
    for (const role of ['admin', 'rep'] as const) {
        test.describe(role, () => {
            test.use({ role });

            test(`AIO-T225: Leads Harbor parity and role access at desktop and phone widths (${role}) @regression`, async ({ leadsHarborPage }) => {
                // Step 1: list metrics at 1440 px
                await leadsHarborPage.openLeadsAt('desktop');
                await leadsHarborPage.assertListHeader(true);
                await leadsHarborPage.assertTitleFontSize(HARBOR_LIST_METRICS.desktop.titleFont);
                await leadsHarborPage.assertListControlHeights('desktop', true);
                await leadsHarborPage.assertDesktopTableMetrics();
                await leadsHarborPage.assertNoConvertButtonInRows();
                await leadsHarborPage.assertPageWidthWithinDesign();

                // Step 1: at 375 px the table becomes cards and controls are 44 px
                await leadsHarborPage.openLeadsAt('phone');
                await leadsHarborPage.assertListControlHeights('phone', true);
                await leadsHarborPage.assertPhoneCardList();

                // Step 2: record and form
                await leadsHarborPage.openPath(LEAD_RECORD_PATH);
                await leadsHarborPage.assertRecordTitle(HARBOR_LIST_METRICS.desktop.titleFont);
                await leadsHarborPage.openPath(NEW_LEAD_PATH);
                await leadsHarborPage.assertCreateFormAvailable();
            });
        });
    }

    test.describe('viewer', () => {
        test.use({ role: 'viewer' });

        test('AIO-T225: Leads Harbor parity and role access at desktop and phone widths (viewer) @regression', async ({ leadsHarborPage }) => {
            // Step 1: list metrics without create controls at both widths
            await leadsHarborPage.openLeadsAt('desktop');
            await leadsHarborPage.assertListHeader(false);
            await leadsHarborPage.assertTitleFontSize(HARBOR_LIST_METRICS.desktop.titleFont);
            await leadsHarborPage.assertListControlHeights('desktop', false);
            await leadsHarborPage.openLeadsAt('phone');
            await leadsHarborPage.assertListControlHeights('phone', false);
            await leadsHarborPage.assertPhoneCardList();

            // Step 2: record is readable, the form refuses creation
            await leadsHarborPage.openPath(LEAD_RECORD_PATH);
            await leadsHarborPage.assertRecordTitle(HARBOR_LIST_METRICS.desktop.titleFont);
            await leadsHarborPage.openPath(NEW_LEAD_PATH);
            await leadsHarborPage.assertViewerCannotCreate();
        });
    });

    test('AIO-T225: Leads interactions: bulk bar and adjacent pages after the sidebar change (admin) @regression', async ({ leadsHarborPage }) => {
        // Step 3: selecting rows offers the bulk actions
        await leadsHarborPage.openLeadsAt('desktop');
        await leadsHarborPage.selectAllAndAssertBulkBar(BULK_ACTIONS);

        // Step 3: Contacts and Dashboard stay usable
        await leadsHarborPage.openAdjacentPage('Contacts', /\/contacts/);
        await leadsHarborPage.openAdjacentPage('Dashboard', /\/(dashboard)?$/);
    });
});
