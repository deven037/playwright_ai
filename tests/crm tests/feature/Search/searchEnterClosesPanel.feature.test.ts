import { test } from '@fixtures/CrmFixtures';

test('AIO-T206: Enter on a highlighted search result navigates and leaves the search panel closed @smoke @regression', async ({
    searchPage
}) => {
    await searchPage.signInAs('rep');
    await searchPage.openSearchWithShortcut();
    await searchPage.assertEnterOnHighlightedResultLeavesPanelClosed();
    await searchPage.openSearchFromHeader();
    await searchPage.assertEnterOnHighlightedResultLeavesPanelClosed();
});
