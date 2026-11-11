import { BasePage } from "@core/BasePage";
import { Page, errors, expect } from "@playwright/test";

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

  // --- Account detail: Details tab layout (AIO-325) ---------------------------

  private get detailValues() {
    return this.page.locator('.detail-list dd');
  }

  /** Opens /accounts/<id> by URL (the session is already signed in) and waits for the Details list. */
  async openAccountDetail(accountId: string) {
    const baseUrl = this.env.newAppBaseUrl?.trim();
    if (!baseUrl) {
      throw new Error('NEWAPP_BASE_URL is not configured. Set it in .env or CI environment variables.');
    }
    await this.page.goto(`${baseUrl}/accounts/${accountId}`);
    await this.detailValues.first().waitFor({ state: 'visible' });
  }

  async assertDetailValueCount(expected: number) {
    await expect(this.detailValues).toHaveCount(expected);
  }

  /** Every Details value must end at or before the viewport's right edge. */
  async assertDetailValuesWithinViewport(width: number) {
    await expect.poll(
      () => this.detailValues.evaluateAll(
        els => Math.max(...els.map(el => el.getBoundingClientRect().right)),
      ),
      { message: `every .detail-list dd right edge should be <= ${width}` },
    ).toBeLessThanOrEqual(width);
  }

  /** Simulates an account with a very long website by replacing the first Details value with an unbroken link. */
  async setFirstDetailValueToLink(href: string) {
    await this.detailValues.first().evaluate((el, link) => {
      const anchor = document.createElement('a');
      anchor.href = link;
      anchor.textContent = link;
      el.replaceChildren(anchor);
    }, href);
  }
}
