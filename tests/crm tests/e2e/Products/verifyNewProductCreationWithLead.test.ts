import { expect, test } from "@fixtures/CrmFixtures";

test('@e2e Product + Lead Creation', async({
    crmLoginPage,
    leadsPage,
    productsPage,
    dashboardPage,
    adminPage
}) => {

    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();

    await dashboardPage.clickAvatar();
    await adminPage.gotoSetup();

    await productsPage.gotoProducts();
    const url = await productsPage.getPageurl();
    expect(url).toContain("/products");

    await productsPage.createNewProduct();
    await productsPage.chooseLayout('Default');
    await productsPage.fillProductDetails(`Product_${Date.now()}`, "Training", 2000);
    await productsPage.createProduct();
    
    const product = await productsPage.getProductNameFromDetailsPage();

    await productsPage.createLeadFromProduct();
    await leadsPage.fillLeadDetails('New', 'Event', 4500);
    const leadProduct = await leadsPage.getProductName();
    expect(leadProduct).toBe(product);
    await leadsPage.createLead();

    const leadName = await leadsPage.getLeadNameFromDetailsPage();
    await leadsPage.goToLeads();
    await leadsPage.searchInLeadsTable(leadName);

    expect(await leadsPage.getFirstLeadNameFromTable()).toBe(leadName);

})