import { BasePage } from "@core/BasePage";
import { Page, expect } from "@playwright/test";

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

  async gotoDealsList() {
    await this.page.goto('/deals?view=list');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.locator('table tbody tr').first()).toBeVisible();
  }

  async assertNoActiveSortHeader() {
    const headers = this.page.locator('table thead th');
    const count = await headers.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(headers.nth(i)).toHaveAttribute('aria-sort', 'none');
    }
  }

  async getFirstRowAmount(): Promise<number> {
    const rows = this.page.locator('table tbody tr');
    const amounts = await rows.evaluateAll(trs =>
      trs.map(tr => Number((tr.textContent ?? '').match(/\$([\d,]+)/)?.[1]?.replace(/,/g, '') ?? NaN)));
    return amounts[0];
  }

  async getListAmounts(): Promise<number[]> {
    const rows = this.page.locator('table tbody tr');
    return rows.evaluateAll(trs =>
      trs.map(tr => Number((tr.textContent ?? '').match(/\$([\d,]+)/)?.[1]?.replace(/,/g, '') ?? NaN)));
  }

  async clickAmountHeader() {
    await this.page.locator('table thead th', { hasText: 'Amount' }).click();
  }

  async assertAmountHeaderSort(sort: 'ascending' | 'descending') {
    await expect(this.page.locator('table thead th', { hasText: 'Amount' })).toHaveAttribute('aria-sort', sort);
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
}
