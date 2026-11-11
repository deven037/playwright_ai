import { test } from "@fixtures/CrmFixtures";
import {
    ACCOUNT_DETAIL_VALUE_COUNT,
    ACCOUNT_IDS,
    DESKTOP_WIDTH,
    LONG_UNBROKEN_LINK,
    MOBILE_WIDTH,
    TABLET_WIDTH,
    VIEWPORT_HEIGHT
} from "../../../../src/data/layout.data";

test.beforeEach(async ({ crmLoginPage, dashboardPage }) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();
});

test('AIO-T157: Account detail has no horizontal overflow at 375 px @smoke @regression', async ({ accountsPage }) => {
    await accountsPage.setViewport(MOBILE_WIDTH, VIEWPORT_HEIGHT);
    await accountsPage.openAccountDetail(ACCOUNT_IDS[0]);
    await accountsPage.assertDetailValueCount(ACCOUNT_DETAIL_VALUE_COUNT);
    await accountsPage.assertNoHorizontalOverflow(MOBILE_WIDTH);
    await accountsPage.assertDetailValuesWithinViewport(MOBILE_WIDTH);
});

test('AIO-T158: Account detail has no horizontal overflow at 768 and 1440 px @regression', async ({ accountsPage }) => {
    for (const width of [TABLET_WIDTH, DESKTOP_WIDTH]) {
        await accountsPage.setViewport(width, VIEWPORT_HEIGHT);
        for (const accountId of ACCOUNT_IDS) {
            await accountsPage.openAccountDetail(accountId);
            await accountsPage.assertNoHorizontalOverflow(width);
        }
    }
});

test('AIO-T159: Very long unbroken website value wraps inside the Details column at 375 px @regression', async ({ accountsPage }) => {
    await accountsPage.setViewport(MOBILE_WIDTH, VIEWPORT_HEIGHT);
    await accountsPage.openAccountDetail(ACCOUNT_IDS[0]);
    await accountsPage.setFirstDetailValueToLink(LONG_UNBROKEN_LINK);
    await accountsPage.assertDetailValuesWithinViewport(MOBILE_WIDTH);
    await accountsPage.assertNoHorizontalOverflow(MOBILE_WIDTH);
});
