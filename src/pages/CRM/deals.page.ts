import { BasePage } from "@core/BasePage";
import { Page } from "@playwright/test";

export class DealsPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async gotoDeals() {
    const dealsBtn = this.page.locator("//a[contains(@class, 'nav-link') and contains(@href, '/deals')]");
    await this.helpers.click(dealsBtn, 'Deals');
    await this.page.waitForLoadState('networkidle');
  }
}
