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
        const addToCartBtn = this.page.locator('.productpagecart');
        const isDisabled = await addToCartBtn.isDisabled();
        return !isDisabled;
    }

    async addToCart() {
        const addToCartBtn = this.page.locator('.productpagecart');
        await this.helpers.click(addToCartBtn, "Add to Cart");
        await this.page.waitForLoadState('networkidle');
    }

    async selectAndAddProductToCart(): Promise<string> {
    const products = this.page.locator(".prdocutname");
    const productCount = await products.count();
    const backBtn = this.page.locator(
        'body > div > div:nth-child(2) > div:nth-child(2) > section > ul > li:nth-child(3) > a'
    );

    for (let i = 0; i < productCount; i++) {
        try {
            // Get product name BEFORE clicking (while still on products list)
            const productName = await this.helpers.getText(products.nth(i));

            // Click on the product to navigate to detail page
            await this.helpers.click(
                products.nth(i + 1),
                `Product ${i + 1} - ${productName}`
            );

            await this.page.waitForLoadState('domcontentloaded');

            // Check if add to cart button is enabled on the detail page
            if (await this.isCartButtonEnabled()) {
                this.logger.step(
                    `Add to Cart button is ENABLED for product: ${productName}`
                );

                await this.takeScreenshot(`product_${i + 1}_enabled`);

                await this.addToCart();

                this.logger.info(
                    `✓ Successfully added "${productName}" to cart`
                );

                return productName;
            } else {
                this.logger.warn(
                    `Add to Cart button is DISABLED for product: ${productName}`
                );

                await this.takeScreenshot(`product_${i + 1}_disabled`);

                // Go back and try next product
                if (i < productCount - 1) {
                    this.logger.step(
                        `Going back to products list to try next product`
                    );

                    await this.helpers.click(backBtn, "Back Button");

                    await this.page.waitForLoadState('networkidle');

                    // Re-fetch products locator after going back
                    const productsReloaded = this.page.locator(".prdocutname");

                    await productsReloaded
                        .first()
                        .waitFor({ state: 'visible' });
                }
            }
        } catch (error) {
            this.logger.error(
                `Error processing product ${i + 1}: ${error}`
            );

            if (i < productCount - 1) {
                try {
                    await this.helpers.click(backBtn, "Back Button");
                    await this.page.waitForLoadState('networkidle');
                } catch (backError) {
                    this.logger.error(
                        `Error clicking back button: ${backError}`
                    );
                }
            }
        }
    }

    throw new Error(
        'No product with enabled Add to Cart button found'
    );
}

    async verifyCartPage() {
        const url = await this.getCurrentUrl();
        return url;
    }
}