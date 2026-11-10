import { BasePage } from "@core/BasePage";
import { Page, errors, expect } from "@playwright/test";
import {
  ACCOUNT_422_BODY, ACCOUNT_500_BODY, ACCOUNT_CREATE_LABEL, ACCOUNT_CREATE_PATH, ACCOUNT_SAVE_ERROR_TEXT,
  ACCOUNT_VIEWPORT_HEIGHT, ACCOUNTS_API_PATTERN,
} from "../../data/accounts.data";

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

  // --- Rejected save (AIO-337 / AIO-344) -----------------------------------

  private get createButton() { return this.page.getByRole('button', { name: ACCOUNT_CREATE_LABEL, exact: true }); }
  private get saveErrorBanner() { return this.page.getByRole('alert').filter({ hasText: ACCOUNT_SAVE_ERROR_TEXT }); }
  private get nameField() { return this.page.getByTestId('account-name'); }
  private isCreatePost(request: { method(): string }) { return request.method() === 'POST'; }

  async openNewAccountForm() {
    await this.gotoAccounts();
    await this.clickNewAccount();
    await this.chooseLayout();
    await expect(this.nameField).toBeVisible();
  }

  async fillAccountName(name: string) {
    await this.helpers.fill(this.nameField, name, 'Account Name Input');
  }

  async mockCreateStatus(status: 422 | 500) {
    await this.page.unroute(ACCOUNTS_API_PATTERN);
    await this.page.route(ACCOUNTS_API_PATTERN, async route => {
      if (!this.isCreatePost(route.request())) return route.fallback();
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(status === 500 ? ACCOUNT_500_BODY : ACCOUNT_422_BODY),
      });
    });
  }

  async mockCreateAborted() {
    await this.page.unroute(ACCOUNTS_API_PATTERN);
    await this.page.route(ACCOUNTS_API_PATTERN, async route => {
      if (!this.isCreatePost(route.request())) return route.fallback();
      await route.abort('failed');
    });
  }

  async removeCreateMock() {
    await this.page.unroute(ACCOUNTS_API_PATTERN);
  }

  /** Clicks Create account and returns the status of the POST /api/accounts response. */
  async submitAndGetCreateStatus() {
    const responsePromise = this.page.waitForResponse(
      r => new URL(r.url()).pathname === '/api/accounts' && r.request().method() === 'POST',
    );
    await this.createAccount();
    return (await responsePromise).status();
  }

  async assertSaveRejectedState(name?: string) {
    await expect(this.saveErrorBanner).toBeVisible();
    await expect(this.createButton).toBeEnabled();
    await expect(this.page).toHaveURL(ACCOUNT_CREATE_PATH);
    if (name !== undefined) await expect(this.nameField).toHaveValue(name);
  }

  async assertNoHorizontalOverflow(widths: readonly number[]) {
    for (const width of widths) {
      await this.page.setViewportSize({ width, height: ACCOUNT_VIEWPORT_HEIGHT });
      await expect.poll(
        () => this.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
        { message: `horizontal overflow at ${width}px` },
      ).toBeLessThanOrEqual(0);
    }
  }
}
