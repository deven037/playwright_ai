import { expect, test } from "@fixtures/CrmFixtures";

test.use({ authRole: 'admin' });

test('@regression Product edit + delete', async({
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

    await dashboardPage.clickAvatar();
    await adminPage.gotoSetup();
    await productsPage.gotoProducts();
    await productsPage.searchInProductTable(name);
    await productsPage.clickProductName();
    await productsPage.openDetailPage();
    const editProductDetails = await productsPage.editProduct("Updated Product Name", name);
    const updatedProductName = editProductDetails.productName;
    await productsPage.createProduct();

    // const updatedProductOnDetailPage = await productsPage.getProductNameFromDetailsPage();
    // expect(updatedProductOnDetailPage).toBe(updatedProductName);

    await dashboardPage.clickAvatar();
    await adminPage.gotoSetup();
    await productsPage.gotoProducts();
    await productsPage.searchInProductTable(updatedProductName);
    await productsPage.clickProductName();
    await productsPage.openDetailPage();
    await productsPage.deleteProduct();
    await productsPage.confirmDelete(true);
    
    await productsPage.searchInProductTable(updatedProductName);
    await productsPage.getNoRecordFoundMessaage();
})