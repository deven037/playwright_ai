import { expect, test } from '@fixtures/CrmFixtures';
import { ACCOUNT_IDS, DETAIL_WIDTHS, LONG_WEBSITE_LENGTH, NARROW_WIDTH } from '../../../src/data/detailOverflow.data';

test('AIO-T157/T158: Account Details fit at 375/768/1440 @regression', async ({ crmLoginPage, detailOverflowPage }) => {
    await crmLoginPage.goto();
    for (const width of DETAIL_WIDTHS) {
        await detailOverflowPage.setViewport(width);
        for (const id of ACCOUNT_IDS) {
            await detailOverflowPage.gotoAccount(id);
            await detailOverflowPage.assertNoHorizontalOverflow();
        }
    }
});

test('AIO-T159: unbroken website wraps at 375 @regression', async ({ crmLoginPage, detailOverflowPage }) => {
    await crmLoginPage.goto();
    await detailOverflowPage.setViewport(NARROW_WIDTH);
    await detailOverflowPage.gotoAccount(ACCOUNT_IDS[0]);
    await detailOverflowPage.injectLongWebsite(LONG_WEBSITE_LENGTH);
    await detailOverflowPage.assertNoHorizontalOverflow();
});

test('AIO-T160: Contact Details fit at 375/768/1440 @regression', async ({ crmLoginPage, detailOverflowPage }) => {
    await crmLoginPage.goto();
    await detailOverflowPage.openFirstContact();
    for (const width of DETAIL_WIDTHS) {
        await detailOverflowPage.setViewport(width);
        await detailOverflowPage.assertDetailValuesVisible();
        await detailOverflowPage.assertNoHorizontalOverflow();
    }
});
