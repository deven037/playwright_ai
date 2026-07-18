import { expect, test } from "@fixtures/CrmFixtures";

test('@sanity Product Creation', async({
    crmLoginPage,
    productsPage
}) => {

    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();

    await productsPage.gotoProducts();
    const url = await productsPage.getPageurl();
    expect(url).toContain("/products");

    await productsPage.createNewProduct();
    const productNameOnForm = await productsPage.fillProductDetails(`Product_${Date.now()}`, "Training", 2000);
    const name = productNameOnForm.productName;
    await productsPage.createProduct();
    
    const product = await productsPage.getProductNameFromDetailsPage();
    expect(product).toBe(name);
})