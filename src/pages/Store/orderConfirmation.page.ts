import { BasePage } from '../../core/BasePage';
import { Page } from "@playwright/test";

export class OrderConfirmationPage extends BasePage {

    constructor(page: Page) {
        super(page);
    }

    private get orderMessage() {
        return this.page.locator('#maincontainer p').filter({ hasText: /order.*#\s*\d+/i });
    }

    async waitForPageLoad(): Promise<void> {
        await this.helpers.waitForElement(this.orderMessage, 'visible', 'Order confirmation number');
        this.logger.info("Order Confirmation Page loaded successfully.");
    }

    async getOrderID(): Promise<string> {
        const locator = this.orderMessage;
        const orderMsg = await this.helpers.getText(locator);
        const orderNumber = orderMsg.split('#')[1]?.match(/\d+/)?.[0];

        if (!orderNumber) {
            throw new Error(`Could not extract order number from: ${orderMsg}`);
        }

        this.logger.info(`Order ID extracted: ${orderNumber}`);
        return orderNumber;
    }

    async invoiceLink() {
        const invoiceLink = this.page.getByRole('link', { name: 'invoice page' });
        await this.helpers.click(invoiceLink, "Invoice Link");
        this.logger.info("Navigating to Invoice Page");
        await this.page.waitForLoadState('domcontentloaded');
    }

    async getAmountOnInvoice(): Promise<string> {
        const amountLocator = this.page.locator('#maincontainer > div > div.col-md-9.col-xs-12.mt20 > div > div > div:nth-child(2) > div.col-md-4.col-sm-6.col-xs-8.pull-right > table > tbody > tr:nth-child(3) > td:nth-child(2)');
        const amount = await this.helpers.getText(amountLocator);
        this.logger.info(`Amount on Invoice: ${amount}`);
        return amount;
    }
}