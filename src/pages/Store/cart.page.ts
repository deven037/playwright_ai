import { BasePage } from "@core/BasePage";
import { Page } from "@playwright/test";

export class CartPage extends BasePage {

    constructor(page: Page) {
        super(page);
    }

    async waitForPageLoad(): Promise<void> {
        const checkoutBtn = this.page.locator('#cart_checkout2');
        await checkoutBtn.waitFor({ state: 'visible', timeout: 15000 });
        this.logger.step('Cart page loaded successfully');
    }

    async getTotalAmount(): Promise<string> {
        const totalAmount = this.page.locator('.totalamout').nth(1);
        await totalAmount.waitFor({ state: 'visible', timeout: 10000 });
        const amount = await this.helpers.getText(totalAmount);
        this.logger.info(`Cart Total Amount: ${amount}`);
        return amount;
    }

    async getTotalAmountOnOrderSummary(): Promise<string> {
        const orderSummaryTotal = this.page.locator('.totalamout').nth(1);
        await orderSummaryTotal.waitFor({ state: 'visible', timeout: 10000 });
        const amount = await this.helpers.getText(orderSummaryTotal);
        this.logger.info(`Order Summary Total Amount: ${amount}`);
        return amount;
    }

    async proceedToCheckout() {
        const checkoutBtn = this.page.locator('#cart_checkout2');
        await this.helpers.click(checkoutBtn, "Proceed to Checkout");
        await this.page.waitForLoadState('networkidle');
    }

    async confirmOrder() {
        const confirmOrderBtn = this.page.locator('#checkout_btn');
        await this.helpers.click(confirmOrderBtn, "Confirm Order");
        await this.page.waitForLoadState('networkidle');
    }
}