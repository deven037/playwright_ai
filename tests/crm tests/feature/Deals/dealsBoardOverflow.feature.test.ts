import { test } from '@fixtures/CrmFixtures';
import { DEALS_BOARD_WIDTHS } from '../../../../src/data/deals.data';

test('AIO-T197: Deals board does not widen the page at 375 and 768 px @regression', async ({ crmLoginPage, dealsPage }) => {
    await crmLoginPage.goto();
    for (const width of DEALS_BOARD_WIDTHS) {
        await dealsPage.setViewport(width);
        await dealsPage.openBoard();
        await dealsPage.assertPageDoesNotScrollSideways();
        await dealsPage.assertBoardScrollsInsideItself();
    }
});
