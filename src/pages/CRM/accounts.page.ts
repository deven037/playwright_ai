import { BasePage } from "@core/BasePage";
import { ACCOUNT_SAVE } from "../../data/accounts.data";
import { Page, Route, errors, expect } from "@playwright/test";

export class AccountsPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  async waitForPageLoad() {
    await this.page.getByPlaceholder('Search accounts…').waitFor({ state: 'visible' });
  }

  async gotoAccounts() {
    const accounts = this.page.locator("//a[contains(@class, 'nav-link') and contains(@href, '/accounts')]");
    await this.helpers.click(accounts, 'Accounts');
    await this.waitForPageLoad();
  }

  async clickNewAccount() {
    const newAccountBtn = this.page.getByRole('button', { name: '+ New Account' });
    await this.helpers.click(newAccountBtn, 'New Account Button');
  }

  async chooseLayout(layoutId: string = 'layout-default-accounts') {
    const layout = this.page.locator(`//button[@data-testid='layout-picker-item-${layoutId}']`);
    await this.helpers.click(layout, 'Layout');
  }

  async fillAccountDetails(employees: string, phone: string) {
    const accountName = `Account_${Date.now()}`;

    const nameInput = this.page.locator("//input[@data-testid='account-name']");
    await this.helpers.fill(nameInput, accountName, 'Account Name Input');

    const employeesInput = this.page.locator("//input[@data-testid='account-employees']");
    await this.helpers.fill(employeesInput, employees, 'Employees Input');

    const phoneInput = this.page.locator("//input[@data-testid='account-phone']");
    await this.helpers.fill(phoneInput, phone, 'Phone Input');

    return accountName;
  }

  async createAccount() {
    const createBtn = this.page.getByRole('button', { name: 'Create account' });
    await this.helpers.click(createBtn, 'Create Account Button');
  }

  async getAccountNameFromDetailsPage() {
    const detailPage = this.page.locator("//div[@data-testid='account-detail-page']");
    await this.helpers.waitForElement(detailPage, 'visible');
    const accountName = this.page.locator("//div[@data-testid='account-detail-page']//h1");
    await this.helpers.assertVisible(accountName, 'Account Name is visible');
    return await this.helpers.getText(accountName);
  }

  async deleteAccount() {
    const deleteBtn = this.page.locator("//button[@data-testid='delete-account-btn']");
    await this.helpers.click(deleteBtn, 'Delete Account Button');
  }

  async confirmDelete() {
    const confirmBtn = this.page.locator("//button[@data-testid='confirm-delete-btn']");
    await this.helpers.click(confirmBtn, 'Confirm Delete Button');
    await this.page.waitForURL(/\/accounts$/);
  }

  async searchInAccountsTable(accountName: string) {
    const searchInput = this.page.getByPlaceholder('Search accounts…');
    await this.helpers.fill(searchInput, accountName, 'Search Input');
  }

  async assertAccountListed(accountName: string) {
    const row = this.page.locator('table').getByText(accountName, { exact: true });
    await expect(row.first()).toBeVisible();
  }

  async assertAccountNotListed(accountName: string) {
    const row = this.page.locator('table').getByText(accountName, { exact: true });
    await expect(row).toHaveCount(0);
  }

  async openAccount(accountName: string) {
    const row = this.page.locator('table').getByText(accountName, { exact: true }).first();
    await this.helpers.click(row, 'Account Name in table');
  }

  async assertNoRecordFoundMessage() {
    const empty = this.page.getByText(/No accounts match/);
    await this.helpers.assertVisible(empty, 'Empty search result message');
  }

  /** Cleanup: removes the account if it is still listed; does nothing if already deleted. */
  async deleteAccountIfExists(accountName: string) {
    await this.gotoAccounts();
    await this.searchInAccountsTable(accountName);
    const row = this.page.locator('table').getByText(accountName, { exact: true });
    try {
      await row.first().waitFor({ state: 'visible', timeout: 5000 });
    } catch (error) {
      // Only a timeout means "not listed"; any other failure is a real problem
      if (error instanceof errors.TimeoutError) {
        return;
      }
      throw error;
    }
    await this.openAccount(accountName);
    await this.deleteAccount();
    await this.confirmDelete();
  }

  private saveFailure: 'abort' | 500 | 422 = 500;
  private readonly savePattern = '**/api/accounts';
  private readonly rejectSave = async (route: Route) => {
    if (route.request().method() !== 'POST') return route.continue();
    if (this.saveFailure === 'abort') return route.abort('failed');
    return route.fulfill({ status: this.saveFailure, json: ACCOUNT_SAVE.response });
  };

  async openCreateForm(name: string) {
    await this.gotoAccounts();
    await this.clickNewAccount();
    await this.chooseLayout();
    await this.helpers.waitForElement(this.page.getByTestId('account-form-page'));
    await this.helpers.fill(this.page.getByTestId('account-name'), name, 'Account name');
  }

  async rejectAccountSaves(failure: 'abort' | 500 | 422) {
    await this.page.unroute(this.savePattern, this.rejectSave);
    this.saveFailure = failure;
    await this.page.route(this.savePattern, this.rejectSave);
  }

  async removeSaveMock() {
    await this.page.unroute(this.savePattern, this.rejectSave);
  }

  async submitAndAssertStatus(status: number) {
    const response = this.page.waitForResponse(response =>
      new URL(response.url()).pathname === '/api/accounts' &&
      response.request().method() === 'POST');
    await this.createAccount();
    expect((await response).status()).toBe(status);
  }

  async assertRejectedSave(name: string) {
    const form = this.page.getByTestId('account-form-page');
    await expect(form.getByRole('alert')).toHaveText(ACCOUNT_SAVE.banner);
    const button = form.getByRole('button', { name: ACCOUNT_SAVE.button, exact: true });
    await expect(button).toHaveText(ACCOUNT_SAVE.button);
    await expect(button).toBeEnabled();
    await expect(form.getByTestId('account-name')).toHaveValue(name);
    await this.helpers.assertURL(/\/accounts\/new(?:[?].*)?$/);
  }

  async assertNoOverflowAtWidths(widths: readonly number[]) {
    for (const width of widths) {
      await this.page.setViewportSize({ width, height: 900 });
      await this.helpers.assertVisible(this.page.getByTestId('account-form-page'));
      await expect.poll(() => this.page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth),
        { message: 'No horizontal overflow at ' + width + 'px' }).toBeLessThanOrEqual(0);
    }
  }

  async retryAndAssertCreated() {
    await this.removeSaveMock();
    const response = this.page.waitForResponse(response =>
      new URL(response.url()).pathname === '/api/accounts' &&
      response.request().method() === 'POST');
    await this.createAccount();
    const saved = await response;
    expect(saved.ok()).toBeTruthy();
    await this.helpers.assertURL(/\/accounts\/(?!new(?:[?]|$))[^/?]+$/);
    await this.helpers.assertVisible(this.page.getByTestId('account-detail-page'));
  }
}
