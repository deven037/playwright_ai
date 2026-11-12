import { BasePage } from "@core/BasePage";
import { Page } from "@playwright/test";

export class Product extends BasePage {

    async waitForPageLoad(): Promise<any> {
        await this.page.waitForLoadState("domcontentloaded");
    }

    constructor(page: Page) {
        super(page);
    }

    async gotoProducts() {
        const productBtn = this.page.locator("//a[@data-testid='setup-card-product']");
        await productBtn.click();
        await this.waitForPageLoad();
    }

    async getPageurl() {
        const url = await this.getCurrentUrl();
        return url;
    }

    async createNewProduct() {
        const newLeadBtn = this.page.locator("//div[@class='page-actions']/button");
        await this.helpers.click(newLeadBtn, 'New Lead');
        await this.page.waitForLoadState('networkidle');
    }
    
    async fillProductDetails(productName: string, category: string, price: number) {
        const productNameInput = this.page.locator("//input[@data-testid='product-name']");
        await this.helpers.fill(productNameInput, productName, `${productName} Entered`);

        const categoryBtn = this.page.locator("//button[@data-testid='product-category']");
        await this.helpers.click(categoryBtn, "Product Category")
        const categoryOption = this.page.getByRole('option', { name: category });
        await this.helpers.click(categoryOption, `${category} Selected`);

        const priceInput = this.page.locator("//input[@data-testid='product-price']");
        await this.helpers.fill(priceInput, price.toString(), `${price} Entered`);

        return {productName};
    }

    async createProduct() {
        const createProductBtn = this.page.locator("//div[@class='form-actions']/button").nth(1);
        const saveProductBtn = this.page.locator("//button[@data-testid='save-product-btn']");

        if(await createProductBtn.isVisible()) {
            await this.helpers.click(createProductBtn, 'Create Product Button');
            await this.page.waitForLoadState('networkidle');
        }else if(await saveProductBtn.isVisible()) {
            await this.helpers.click(saveProductBtn, 'Save Product Button');
            await this.page.waitForLoadState('domcontentloaded');
        }
    }

    async getProductNameFromDetailsPage(){
        await this.page.waitForLoadState('domcontentloaded');
        const detailPage = this.page.locator("//div[@data-testid='product-detail-page']");
        await this.helpers.waitForElement(detailPage, 'visible');
        const productName = this.page.locator("//div[@class='page-header']/h1");
        await this.helpers.assertVisible(productName, 'Product Name is visible');
        const name = await this.helpers.getText(productName);
        return name;
    }

    async createLeadFromProduct() {
        const leadTab = this.page.locator("//div[@class='tab-list']/button").nth(1);
        await this.helpers.click(leadTab, "Clicked Lead Tab");
        await this.page.waitForLoadState('domcontentloaded');
        const createLeadBtn = this.page.locator("//button[@data-testid='new-lead-for-product-btn']");
        await this.helpers.click(createLeadBtn, "Clicked + Create Lead Btn");
        await this.waitForPageLoad();
    }

    async searchInProductTable(productName: string) {
        const searchInput = this.page.locator("//div[@class='toolbar']/input");
        await this.helpers.fill(searchInput, productName, 'Search Input');
        await this.page.waitForLoadState('domcontentloaded');
    }

    async getProductByName() {
        this.logger.info("Getting product name from table")
        const name = this.page.locator("(//tr[contains(@class,'row-clickable')]/td)[2]");
        await this.helpers.waitForElement(name, 'visible');
        return await this.helpers.getText(name);
    }

    async clickProductName() {
        const name = this.page.locator(".product-card-body");
        await this.helpers.click(name, "Product Name");
    }

    async openDetailPage() {
        const openFullPage = this.page.locator("//button[text()='Open full page ↗']");
        await this.helpers.click(openFullPage, "Open Full Page");
        await this.waitForPageLoad();
    }

    async editProduct(productName: string, oldValue: string) {
        const productDetail = this.page.locator("//div[@data-testid='product-detail-page']");
        await this.helpers.waitForElement(productDetail, "visible");
        const editBtn = this.page.locator("//button[@data-testid='edit-product-btn']");
        await this.helpers.click(editBtn, "Edit");
        await this.page.waitForLoadState('domcontentloaded');
        const productNameInput = this.page.locator("//div[@class='field']/input").first();
        await this.helpers.fill(productNameInput, productName, `${productName} Entered`);
        return {productName};
    }

    async deleteProduct() {
        const productDetail = this.page.locator("//div[@data-testid='product-detail-page']");
        await this.helpers.waitForElement(productDetail, "visible");
        const deleteBtn = this.page.locator("//button[@data-testid='delete-product-btn']");
        await this.helpers.click(deleteBtn, "Delete");
        await this.page.waitForLoadState('domcontentloaded');
    }

    async confirmDelete(confirm: boolean) {
        const deleteModal = this.page.locator("//div[@class='modal']");
        await this.helpers.waitForElement(deleteModal);

        if(confirm == true) {
            const confirmDeleteBtn = this.page.locator("//button[@data-testid='confirm-delete-btn']");
            await this.helpers.click(confirmDeleteBtn, "Confirm Delete");
        }else{
            const cancelBtn = this.page.locator("//button[@class='btn' and text()='Cancel']");
            await this.helpers.click(cancelBtn, "Cancel");
        }
    }

    async getNoRecordFoundMessaage() {
        const record = this.page.locator("//div[@class='empty-cell']");
        const text = await this.helpers.getText(record);
        this.logger.info(text);
    }

    async chooseLayout(layoutName: string) {
        const layout = this.page.locator(`//span[@class='layout-picker-item-name' and text()='${layoutName}']`);
        await this.helpers.click(layout, "Layout");
    }

    async gotoNewProductForm() {
        const baseUrl = this.env.newAppBaseUrl?.trim();
        await this.page.goto(`${baseUrl}/products/new`);
        const nameInput = this.page.getByTestId('product-name');
        const defaultLayout = this.page.locator("//span[@class='layout-picker-item-name' and text()='Default']");
        await nameInput.or(defaultLayout).first().waitFor({ state: 'visible' });
        if (await defaultLayout.isVisible()) {
            await this.helpers.click(defaultLayout, "Default Layout");
        }
        await this.helpers.waitForElement(nameInput, 'visible', 'Product name input');
    }

    async fillNameAndPrice(productName: string, price: number) {
        await this.helpers.fill(this.page.getByTestId('product-name'), productName, 'Product Name');
        await this.helpers.fill(this.page.getByTestId('product-price'), price.toString(), 'Product Price');
    }

    async clickCreateProduct() {
        await this.helpers.click(this.page.getByRole('button', { name: 'Create product' }), 'Create product');
    }

    async assertOnProductDetailPage() {
        await this.helpers.assertURL(/\/products\/(?!new$)[^/]+$/);
        await this.helpers.waitForElement(this.page.getByTestId('product-detail-page'), 'visible', 'Product detail page');
    }

    async getProductIdFromUrl() {
        return new URL(await this.getCurrentUrl()).pathname.split('/').pop() ?? '';
    }

    async assertDetailHeading(productName: string) {
        await this.helpers.assertText(this.page.locator("//div[@class='page-header']/h1"), productName);
    }
}