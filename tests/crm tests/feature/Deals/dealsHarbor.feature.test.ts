import { test } from '@fixtures/CrmFixtures';
import {
    CARD_ACCOUNT, CARD_AMOUNT, CARD_CLOSE, CARD_DEAL, CARD_DEAL_URL, CARD_PROBABILITY, DEALS_BOARD_WIDTHS, DEALS_DESKTOP_WIDTH, DEAL_STAGES,
    LIST_COLUMNS, LIST_ROW_COUNT, MOVE_DEAL, MOVE_FROM_STAGE, MOVE_TO_STAGE, NEGOTIATION_COUNT, NEGOTIATION_STAGE,
    NO_MATCH_TERM, SEARCH_TERM, SMALLEST_AMOUNT,
} from '../../../../src/data/deals.data';

test.describe('Deals Harbor redesign (AIO-392)', () => {
    test('AIO-T192: Deals board: stage columns, cards and keyboard Move to… persistence @smoke', async ({ crmLoginPage, dealsPage }) => {
        await crmLoginPage.goto();

        // Step 1: board shows the five stage columns, each with count and total
        await dealsPage.openBoard();
        await dealsPage.assertBoardColumns(DEAL_STAGES);

        // Step 2: a card shows name, account, amount, probability, close date and a Move menu
        await dealsPage.assertCardDetails(CARD_DEAL, CARD_ACCOUNT, CARD_AMOUNT, CARD_PROBABILITY, CARD_CLOSE);

        try {
            // Step 3: moving Marble Pilot to Proposal toasts, updates both counts and keeps focus on the menu
            const fromCount = await dealsPage.getStageCount(MOVE_FROM_STAGE);
            const toCount = await dealsPage.getStageCount(MOVE_TO_STAGE);
            await dealsPage.moveDeal(MOVE_DEAL, MOVE_TO_STAGE);
            await dealsPage.assertMoveToast(MOVE_DEAL, MOVE_TO_STAGE);
            await dealsPage.assertStageCount(MOVE_FROM_STAGE, fromCount - 1);
            await dealsPage.assertStageCount(MOVE_TO_STAGE, toCount + 1);
            await dealsPage.assertMoveMenuFocused(MOVE_DEAL);

            // Step 4: the move survives a reload
            await dealsPage.reload();
            await dealsPage.assertDealInStage(MOVE_DEAL, MOVE_TO_STAGE);

            // Step 5: moving back restores the seed state
            await dealsPage.moveDeal(MOVE_DEAL, MOVE_FROM_STAGE);
            await dealsPage.assertDealInStage(MOVE_DEAL, MOVE_FROM_STAGE);
            await dealsPage.assertStageCount(MOVE_FROM_STAGE, fromCount);
            await dealsPage.assertStageCount(MOVE_TO_STAGE, toCount);
        } finally {
            await dealsPage.restoreDealStage(MOVE_DEAL, MOVE_FROM_STAGE);
        }

        // Step 6: keyboard opens the edit dialog and Escape returns focus to the card
        await dealsPage.openCardEditorWithKeyboard(CARD_DEAL);
        await dealsPage.closeEditorWithEscape(CARD_DEAL);
    });

    test('AIO-T193: Deals list: columns, sort, search, stage filter, empty result and view persistence @regression', async ({ crmLoginPage, dealsPage }) => {
        await crmLoginPage.goto();
        await dealsPage.openBoard();

        // Step 1: List view has the seven columns and 25 rows
        await dealsPage.showListView();
        await dealsPage.assertListViewSelected();
        await dealsPage.assertListColumns(LIST_COLUMNS);
        await dealsPage.assertListRowCount(LIST_ROW_COUNT);

        // Step 7 (AIO-393): without choosing a sort no column is marked sorted
        await dealsPage.assertNoColumnSorted();

        // Step 2: List view survives a reload
        await dealsPage.reload();
        await dealsPage.assertListViewSelected();

        // Step 3: the Amount header alternates descending / ascending and the rows follow
        await dealsPage.clickAmountHeader();
        await dealsPage.assertAmountSort('descending');
        await dealsPage.clickAmountHeader();
        await dealsPage.assertAmountSort('ascending');
        await dealsPage.assertFirstRowAmount(SMALLEST_AMOUNT);
        await dealsPage.clickAmountHeader();
        await dealsPage.assertAmountSort('descending');

        // Step 4: stage filter
        await dealsPage.filterByStage(NEGOTIATION_STAGE);
        await dealsPage.assertAllRowsInStage(NEGOTIATION_STAGE, NEGOTIATION_COUNT);

        // Step 5: reset the filter and search
        await dealsPage.filterByStage('All stages');
        await dealsPage.searchDeals(SEARCH_TERM);
        await dealsPage.assertAllRowsMatch(SEARCH_TERM);

        // Step 6: empty result and Clear filters
        await dealsPage.searchDeals(NO_MATCH_TERM);
        await dealsPage.assertNoMatchMessage(NO_MATCH_TERM);
        await dealsPage.clearFilters();
        await dealsPage.assertListRowCount(LIST_ROW_COUNT);
    });

    test.describe('viewer', () => {
        test.use({ role: 'viewer' });

        test('AIO-T194: Deals viewer is read-only on board and record @regression', async ({ crmLoginPage, dealsPage }) => {
            await crmLoginPage.goto();

            // Step 1: board and list are available, no New Deal button and no Move menus
            await dealsPage.openBoard();
            await dealsPage.assertBoardAndListToggleVisible();
            await dealsPage.assertReadOnlyBoard(CARD_DEAL);

            // Step 2: a card opens the record with its details and an account link
            await dealsPage.openCardRecord(CARD_DEAL);
            await dealsPage.assertRecordUrl(CARD_DEAL_URL);
            await dealsPage.assertRecordDetails(CARD_DEAL, CARD_ACCOUNT, [CARD_AMOUNT, CARD_PROBABILITY]);

            // Step 3: no Edit or Delete on the record
            await dealsPage.assertNoRecordWriteActions();
        });
    });

    test('AIO-T195: Deals board and list at 375, 768 and 1440 px @regression', async ({ crmLoginPage, dealsPage }) => {
        await crmLoginPage.goto();
        for (const width of [...DEALS_BOARD_WIDTHS, DEALS_DESKTOP_WIDTH]) {
            await dealsPage.setViewport(width);

            // Step 1: the board scrolls inside its container, the page does not get wider
            await dealsPage.openBoard();
            await dealsPage.assertNoPageOverflow();

            // Step 2: the list fits the viewport
            await dealsPage.openList();
            await dealsPage.assertNoPageOverflow();
        }
    });
});
