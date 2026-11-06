import { expect, test } from "@fixtures/CrmFixtures";

test.use({ authRole: 'admin' });

test('@smoke @regression @sanity Product Creation', async({
    crmLoginPage,
    dashboardPage,
    adminPage,
    productsPage
}) => {


    await dashboardPage.clickAvatar();
    await adminPage.gotoSetup();

    await productsPage.gotoProducts();
    const url = await productsPage.getPageurl();
    expect(url).toContain("/products");

    await productsPage.createNewProduct();
    await productsPage.chooseLayout('Default');
    const productNameOnForm = await productsPage.fillProductDetails(`Product_${Date.now()}`, "Training", 2000);
    const name = productNameOnForm.productName;
    await productsPage.createProduct();
    
    const product = await productsPage.getProductNameFromDetailsPage();
    expect(product).toBe(name);
})