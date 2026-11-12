import { BasePage } from "@core/BasePage";
import { Page, expect } from "@playwright/test";
import { DEALS_VIEWPORT_HEIGHT } from "../../data/deals.data";

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

  async clickNewDeal() {
    const newDealBtn = this.page.locator("//div[@class='page-actions']/button[contains(text(), 'New Deal')]");
    await this.helpers.click(newDealBtn, 'New Deal Button');
  }

  async fillDealDetails(dealName: string, amount: string, accountName?: string) {
    const nameInput = this.page.locator("//input[@data-testid='deal-name']");
    await this.helpers.fill(nameInput, dealName, 'Deal Name Input');

    if (accountName) {
      const accountDropDown = this.page.locator("//button[@data-testid='deal-account']");
      await this.helpers.click(accountDropDown, 'Deal Account Dropdown');
      const accountSearch = this.page.locator("//input[@class='select-search']");
      await this.helpers.fill(accountSearch, accountName, 'Account Search Input');
      const accountOption = this.page.getByRole('option', { name: accountName }).first();
      await this.helpers.click(accountOption, 'Account Option');
    }

    const amountInput = this.page.locator("//input[@data-testid='deal-amount']");
    await this.helpers.fill(amountInput, amount, 'Deal Amount Input');
    await amountInput.blur();
  }

  async createDeal() {
    const createBtn = this.page.locator("//div[@class='form-actions']/button[text()='Create deal']");
    await this.helpers.click(createBtn, 'Create Deal Button');
  }

  async getDealNameFromDetailsPage() {
    const detailPage = this.page.locator("//div[@data-testid='deal-detail-page']");
    await this.helpers.waitForElement(detailPage, 'visible');
    const dealName = this.page.locator("//div[@data-testid='deal-detail-page']//div[@class='page-header']/h1");
    await this.helpers.assertVisible(dealName, 'Deal Name is visible');
    return await this.helpers.getText(dealName);
  }

  async getDealStageFromDetailsPage() {
    const stage = this.page.locator("//span[@data-testid='deal-detail-stage']");
    return await this.helpers.getText(stage);
  }

  async clickDeleteDeal() {
    const deleteBtn = this.page.locator("//button[@data-testid='delete-deal-btn']");
    await this.helpers.click(deleteBtn, 'Delete Deal Button');
  }

  async confirmDeleteDeal() {
    const confirmBtn = this.page.locator("//button[@data-testid='confirm-delete-btn']");
    await this.helpers.click(confirmBtn, 'Confirm Delete Button');
    await this.page.waitForLoadState('networkidle');
  }

  async getDealCardLocator(dealName: string) {
    return this.page.locator(`//div[@class='kanban-card-title' and text()='${dealName}']`);
  }

  // Board layout at narrow widths (AIO-394 / AIO-T197).
  private get kanbanBoard() {
    return this.page.getByTestId('kanban-board');
  }

  async setViewport(width: number) {
    await this.helpers.setViewport({ width, height: DEALS_VIEWPORT_HEIGHT });
  }

  // Relative to the origin of the page the user is signed in on.
  async openBoard() {
    await this.helpers.navigateTo(new URL('/deals', this.page.url()).href);
    await this.helpers.click(this.page.getByRole('button', { name: 'Board', exact: true }), 'Deals Board view');
    await expect(this.kanbanBoard).toBeVisible();
  }

  async assertPageDoesNotScrollSideways() {
    const width = this.page.viewportSize()!.width;
    await expect.poll(() => this.page.evaluate(() => document.scrollingElement!.scrollWidth)).toBe(width);
  }

  async assertBoardScrollsInsideItself() {
    await expect(this.kanbanBoard).toBeVisible();
    const box = await this.kanbanBoard.evaluate(element => ({
      client: element.clientWidth,
      scroll: element.scrollWidth,
      right: element.getBoundingClientRect().right,
    }));
    expect(box.scroll, 'columns scroll inside the board').toBeGreaterThan(box.client);
    expect(box.right, 'board stays inside the viewport').toBeLessThanOrEqual(this.page.viewportSize()!.width);
  }
}
