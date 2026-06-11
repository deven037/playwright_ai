import { BasePage } from "@core/BasePage";
import { Page } from "@playwright/test";

export class ProductsPage extends BasePage {

    constructor(page: Page) {
        super(page);
    }

    async waitForPageLoad(): Promise<void> {
        await this.page.locator(".prdocutname").first().waitFor({ state: "visible" });
    }

    async getAllVisibleProductNames(): Promise<string[]> {
        await this.takeScreenshot("products_page");
        const products = this.page.locator(".prdocutname");
        const count = await products.count();

        this.logger.step(`Total Products: ${count}`);

        const productNames = [];

        for (let i = 0; i < count; i++) {
            const productName = await this.helpers.getText(products.nth(i));

            if (productName) {
                productNames.push(productName.trim());
            }
        }

        this.logger.info(`Product Names: ${productNames.join(', ')}`);
        return productNames;
    }

    private async isCartButtonEnabled(): Promise<boolean> {
        const addToCartBtn = this.page.locator('.productpagecart').filter({ hasText: /Add to Cart/i });
        return await addToCartBtn.isVisible() && await addToCartBtn.isEnabled();
    }

    async addToCart() {
        const addToCartBtn = this.page.locator('.productpagecart').filter({ hasText: /Add to Cart/i });
        await this.helpers.click(addToCartBtn, "Add to Cart");
        await this.page.waitForLoadState('networkidle');
    }

    async selectAndAddProductToCart(): Promise<string> {
        const products = this.page.locator('.prdocutname');
        const productCount = await products.count();
        const productLinks: { name: string; href: string }[] = [];

        for (let i = 0; i < productCount; i++) {
            const product = products.nth(i);
            const name = (await this.helpers.getText(product)).trim();
            const href = await product.getAttribute('href');

            if (name && href) {
                productLinks.push({ name, href });
            }
        }

        for (const product of productLinks) {
            await this.page.goto(product.href, { waitUntil: 'domcontentloaded' });

            if (await this.isCartButtonEnabled()) {
                this.logger.step(`Add to Cart button is enabled for product: ${product.name}`);
                await this.addToCart();
                this.logger.info(`Successfully added "${product.name}" to cart`);
                return product.name;
            }

            this.logger.warn(`Skipping unavailable product: ${product.name}`);
        }

        throw new Error('No product with enabled Add to Cart button found');
    }

    async verifyCartPage() {
        const url = await this.getCurrentUrl();
        return url;
    }
}
