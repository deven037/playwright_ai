import { expect, test } from "@fixtures/CrmFixtures";
import { concurrentProducts } from "../../../../src/data/products.data";

test('AIO-T165: Concurrent product creation in two sessions opens each session\'s own product detail page @regression', async ({
    crmLoginPage,
    productsPage,
    secondSession
}) => {
    const sessionB = secondSession.productsPage;
    const nameA = concurrentProducts.nameFor('A');
    const nameB = concurrentProducts.nameFor('B');

    // Step 1: sign in as admin in two independent sessions and open the New product form
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await secondSession.crmLoginPage.goto();
    await secondSession.crmLoginPage.loginWithDefaultCredentials();
    await productsPage.gotoNewProductForm();
    await sessionB.gotoNewProductForm();

    // Step 2: fill each form with its own name and price
    await productsPage.fillNameAndPrice(nameA, concurrentProducts.priceA);
    await sessionB.fillNameAndPrice(nameB, concurrentProducts.priceB);

    // Step 3: click Create product in both sessions at the same time
    await Promise.all([productsPage.clickCreateProduct(), sessionB.clickCreateProduct()]);
    await productsPage.assertOnProductDetailPage();
    await sessionB.assertOnProductDetailPage();
    const idA = await productsPage.getProductIdFromUrl();
    const idB = await sessionB.getProductIdFromUrl();
    expect(idA).not.toBe(idB);

    // Step 4: each detail heading shows the name entered in that session
    await productsPage.assertDetailHeading(nameA);
    await sessionB.assertDetailHeading(nameB);
});
