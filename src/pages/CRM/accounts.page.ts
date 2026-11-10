import { BasePage } from "@core/BasePage";
import { Page, errors, expect } from "@playwright/test";
import { ACCOUNT_FORM_ACCESSIBLE_NAMES, ACCOUNT_FORM_LABELS, NEW_ACCOUNT_PATH } from "../../data/accounts.data";

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

  /** Accounts list -> New Account -> default layout, ending on the empty new-account form. */
  async openNewAccountForm() {
    await this.gotoAccounts();
    await this.clickNewAccount();
    await this.chooseLayout();
    await this.helpers.waitForElement(this.page.getByTestId('account-form-page'), 'visible', 'New account form');
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

  /** Fills name, employees and revenue; returns the generated account name. */
  async fillNameEmployeesRevenue(employees: string, revenue: string) {
    const accountName = `QA_Neg_${Date.now()}`;
    await this.helpers.fill(this.page.getByTestId('account-name'), accountName, 'Account Name Input');
    await this.setEmployees(employees);
    await this.setRevenue(revenue);
    return accountName;
  }

  async setEmployees(value: string) {
    await this.helpers.fill(this.page.getByTestId('account-employees'), value, 'Employees Input');
  }

  async setRevenue(value: string) {
    await this.helpers.fill(this.page.getByTestId('account-revenue'), value, 'Revenue Input');
  }

  async createAccount() {
    const createBtn = this.page.getByRole('button', { name: 'Create account' });
    await this.helpers.click(createBtn, 'Create Account Button');
  }

  async assertStillOnNewAccountForm() {
    await expect(this.page).toHaveURL(NEW_ACCOUNT_PATH);
    await expect(this.page.getByTestId('account-form-page')).toBeVisible();
  }

  /** Field error is shown and wired to its input through aria-invalid / aria-describedby. */
  async assertFieldError(field: 'employees' | 'revenue', message: string) {
    const input = this.page.getByTestId(`account-${field}`);
    const error = this.page.locator(`#account-${field}-error`);
    await expect(error).toHaveText(message);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('aria-describedby', `account-${field}-error`);
  }

  async assertNoFieldError(field: 'employees' | 'revenue') {
    await expect(this.page.locator(`#account-${field}-error`)).toHaveCount(0);
    await expect(this.page.getByTestId(`account-${field}`)).not.toHaveAttribute('aria-invalid', 'true');
  }

  async assertFieldValue(field: 'employees' | 'revenue', value: string) {
    await expect(this.page.getByTestId(`account-${field}`)).toHaveValue(value);
  }

  /** Clicks each label and checks focus lands on the matching control. */
  async assertLabelsFocusTheirControls() {
    for (const { label, controlId } of ACCOUNT_FORM_LABELS) {
      await this.page.locator(`label[for="${controlId}"]`).filter({ hasText: label }).click();
      await expect(this.page.locator(`#${controlId}`), `${label} label focuses its control`).toBeFocused();
      // close an opened Select list so it does not cover the next label
      await this.page.keyboard.press('Escape');
    }
  }

  async assertControlAccessibleNames() {
    for (const { controlId, name } of ACCOUNT_FORM_ACCESSIBLE_NAMES) {
      await expect(this.page.locator(`#${controlId}`)).toHaveAccessibleName(name);
    }
  }

  /** At each viewport the field errors are visible and the page does not scroll sideways. */
  async assertErrorsVisibleWithoutOverflow(viewports: readonly { width: number; height: number }[]) {
    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await expect(this.page.locator('#account-employees-error')).toBeVisible();
      const overflows = await this.page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflows, `horizontal overflow at ${viewport.width}px`).toBe(false);
    }
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
}
