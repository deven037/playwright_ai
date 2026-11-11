import { BasePage } from "@core/BasePage";
import { Page, Route, errors, expect } from "@playwright/test";
import { EDIT_ACCOUNT, REJECTED_SAVE_BODY, SAVE_ACCOUNT_ERROR } from "../../data/accounts.data";

export class AccountsPage extends BasePage {
  private rejectedSaveRequests = 0;
  private readonly accountApiPattern = `**/api/accounts/${EDIT_ACCOUNT.id}`;
  private readonly rejectSaveRoute = async (route: Route) => {
    const method = route.request().method();
    if (method !== 'PUT' && method !== 'PATCH') return route.continue();
    this.rejectedSaveRequests++;
    return route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify(REJECTED_SAVE_BODY),
    });
  };

  constructor(page: Page) {
    super(page);
  }

  private searchBox() {
    return this.page.getByRole('searchbox', { name: 'Search accounts' });
  }

  async waitForPageLoad() {
    await this.searchBox().waitFor({ state: 'visible' });
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
    await this.helpers.fill(this.searchBox(), accountName, 'Search Input');
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

  // --- AIO-331: inline edit and rejected save ------------------------------

  private get editButton() { return this.page.getByTestId('edit-account-btn'); }
  private get saveButton() { return this.page.getByTestId('save-account-btn'); }
  private get saveError() { return this.page.getByTestId('save-account-error'); }
  private get phoneField() {
    return this.page.getByTestId('account-detail-page').locator('.field', { hasText: 'Phone' }).getByRole('textbox');
  }

  async openSeededAccountForEdit() {
    await this.gotoAccounts();
    await this.searchInAccountsTable(EDIT_ACCOUNT.name);
    await this.openAccount(EDIT_ACCOUNT.name);
    await this.helpers.assertURL(new RegExp(`/accounts/${EDIT_ACCOUNT.id}$`));
    await this.helpers.click(this.editButton, 'Edit Account Button');
  }

  async assertEditFormWithSaveEnabled() {
    await expect(this.saveButton).toBeVisible();
    await expect(this.saveButton).toBeEnabled();
    await expect(this.phoneField).toBeVisible();
  }

  async rejectAccountSaves() {
    this.rejectedSaveRequests = 0;
    await this.page.route(this.accountApiPattern, this.rejectSaveRoute);
  }

  async stopRejectingAccountSaves() {
    await this.page.unroute(this.accountApiPattern, this.rejectSaveRoute);
  }

  async editPhone(phone: string) {
    await this.helpers.fill(this.phoneField, phone, 'Phone Input');
  }

  async clickSave() {
    await this.helpers.click(this.saveButton, 'Save Account Button');
  }

  async assertSaveErrorShown() {
    await expect(this.saveError).toHaveAttribute('role', 'alert');
    await expect(this.saveError).toHaveText(SAVE_ACCOUNT_ERROR);
  }

  async assertEditFormKept(phone: string) {
    await expect(this.saveButton).toBeEnabled();
    await expect(this.phoneField).toHaveValue(phone);
  }

  async assertRejectedSaveRequests(count: number) {
    await expect.poll(() => this.rejectedSaveRequests).toBe(count);
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
}
