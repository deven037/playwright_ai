import { expect, test } from "@fixtures/CrmFixtures";

test('@regression Product edit + delete', async({
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

    await productsPage.gotoProducts();
    await productsPage.searchInProductTable(name);
    await productsPage.clickProductName();
    const editProductDetails = await productsPage.editProduct("Updated Product Name", name);
    const updatedProductName = editProductDetails.productName;
    await productsPage.createProduct();

    // const updatedProductOnDetailPage = await productsPage.getProductNameFromDetailsPage();
    // expect(updatedProductOnDetailPage).toBe(updatedProductName);

    await productsPage.gotoProducts();
    await productsPage.searchInProductTable(updatedProductName);
    await productsPage.clickProductName();
    await productsPage.deleteProduct();
    await productsPage.confirmDelete(true);
    
    await productsPage.searchInProductTable(updatedProductName);
    await productsPage.getNoRecordFoundMessaage();
})