import { test } from "@fixtures/CrmFixtures";
import { SEE_ALL_ACCOUNTS, SEE_ALL_CONTACTS } from "../../../../src/data/search.data";

test('AIO-T97: See all preserves company and phone matching and excludes unrelated industry matches @regression', async ({
    crmLoginPage,
    dashboardPage,
    searchPage
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();

    // Steps 1-2: Contacts group advertises five matches, and See all lists all of them.
    await searchPage.searchFor(SEE_ALL_CONTACTS.term);
    await searchPage.assertGroupTotal('Contacts', SEE_ALL_CONTACTS.totalMatches);
    await searchPage.clickSeeAll('Contacts', SEE_ALL_CONTACTS.seeAllLabel);
    await searchPage.assertUrlMatches(SEE_ALL_CONTACTS.urlPattern);
    await searchPage.assertContactCount(SEE_ALL_CONTACTS.totalMatches);
    await searchPage.assertContactListed(SEE_ALL_CONTACTS.companyOnlyMatch.name);

    // Step 3: Accounts See all shows exactly the advertised accounts, without industry-only matches.
    await searchPage.searchFor(SEE_ALL_ACCOUNTS.term);
    await searchPage.assertGroupTotal('Accounts', SEE_ALL_ACCOUNTS.totalMatches);
    await searchPage.clickSeeAll('Accounts', SEE_ALL_ACCOUNTS.seeAllLabel);
    await searchPage.assertUrlMatches(SEE_ALL_ACCOUNTS.urlPattern);
    await searchPage.assertAccountRowCount(SEE_ALL_ACCOUNTS.totalMatches);
});
