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
        const productBtn = this.page.locator("//a[contains(@class, 'nav-link') and contains(@href, '/products')]");
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
        const createProductBtn = this.page.locator("//div[@class='form-actions']/button[2]");
        await this.helpers.click(createProductBtn, "Product Created");
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
        const createLeadBtn = this.page.locator("//button[@data-testid='new-lead-for-product-btn']");
        await this.helpers.click(createLeadBtn, "Clicked + Create Lead Btn");
        await this.waitForPageLoad();
    }
}