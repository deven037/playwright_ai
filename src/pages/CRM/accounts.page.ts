import { AuthManager } from '../../utils/AuthManager';
import { Helpers } from '../../utils/Helpers';
import { ACCOUNT_DELETE } from '../../data/accounts.data';
import { BasePage } from "@core/BasePage";
import { Page, Route, errors, expect } from "@playwright/test";
import { ACCOUNT_FORM_ACCESSIBLE_NAMES, ACCOUNT_FORM_LABELS, ACCOUNT_FORM_VIEWPORTS, NEW_ACCOUNT_PATH, EDIT_ACCOUNT, REJECTED_SAVE_BODY, RETRY_ACCOUNT_NAME_PREFIX, SAVE_ACCOUNT_ERROR } from "../../data/accounts.data";

export class AccountsPage extends BasePage {
  private rejectedSaveRequests = 0;
  private rejectedCreateRequests = 0;
  private readonly createApiPattern = '**/api/accounts';
  private createRoute?: (route: Route) => Promise<void>;
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
    return this.page.getByRole('searchbox', { name: 'Search accounts', exact: true });
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
      const labelLocator = this.page.locator(`label[for="${controlId}"]`).filter({ hasText: label });
      const controlLocator = this.page.locator(`#${controlId}`);
      await this.helpers.click(labelLocator, `${label} label`);
      await expect(controlLocator, `${label} label focuses its control`).toBeFocused();
      // close an opened Select list so it does not cover the next label
      await this.helpers.pressKey(controlLocator, 'Escape', `${label} control`);
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

  /** The list shows exactly these accounts (by name), no more and no fewer. */
  async assertListedAccounts(names: readonly string[]) {
    await expect(this.page.locator('table tbody tr')).toHaveCount(names.length);
    for (const name of names) {
      await this.assertAccountListed(name);
    }
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

  // --- AIO-344 / AIO-337: rejected save on the create form -----------------

  private get createButton() { return this.page.getByRole('button', { name: /^(Create account|Creating…)$/ }); }
  private get createError() { return this.page.getByRole('alert').filter({ hasText: SAVE_ACCOUNT_ERROR }); }
  private get nameField() { return this.page.getByTestId('account-name'); }

  async fillAccountName(name: string) {
    await this.helpers.fill(this.nameField, name, 'Account Name Input');
  }

  /** Fills the name with a unique retry-test name and returns it. */
  async fillGeneratedAccountName() {
    const name = `${RETRY_ACCOUNT_NAME_PREFIX}${Date.now()}`;
    await this.fillAccountName(name);
    return name;
  }

  /** Answers every POST /api/accounts with the given HTTP status; other methods pass through. */
  async rejectAccountCreates(status: number, body: object) {
    await this.stopInterceptingAccountCreates();
    this.rejectedCreateRequests = 0;
    this.createRoute = async (route: Route) => {
      if (route.request().method() !== 'POST') return route.continue();
      this.rejectedCreateRequests++;
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    };
    await this.page.route(this.createApiPattern, this.createRoute);
  }

  /** Aborts every POST /api/accounts as a network failure; other methods pass through. */
  async abortAccountCreates() {
    await this.stopInterceptingAccountCreates();
    this.rejectedCreateRequests = 0;
    this.createRoute = async (route: Route) => {
      if (route.request().method() !== 'POST') return route.continue();
      this.rejectedCreateRequests++;
      return route.abort('failed');
    };
    await this.page.route(this.createApiPattern, this.createRoute);
  }

  async stopInterceptingAccountCreates() {
    if (!this.createRoute) return;
    await this.page.unroute(this.createApiPattern, this.createRoute);
    this.createRoute = undefined;
  }

  async assertRejectedCreateRequests(count: number) {
    await expect.poll(() => this.rejectedCreateRequests).toBe(count);
  }

  async assertCreateFailedAndFormReset(name: string) {
    await expect(this.createError).toBeVisible();
    await expect(this.createError).toHaveText(SAVE_ACCOUNT_ERROR);
    await expect(this.createButton).toHaveText('Create account');
    await expect(this.createButton).toBeEnabled();
    await expect(this.nameField).toHaveValue(name);
    await this.helpers.assertURL(NEW_ACCOUNT_PATH);
  }

  async assertNoHorizontalOverflowAtFormViewports() {
    for (const viewport of ACCOUNT_FORM_VIEWPORTS) {
      await this.helpers.setViewport(viewport);
      await expect
        .poll(() => this.helpers.getHorizontalOverflow(), { message: `horizontal overflow at ${viewport.width}px` })
        .toBeLessThanOrEqual(0);
    }
  }

  async assertAccountDetailShown(name: string) {
    expect(await this.getAccountNameFromDetailsPage()).toBe(name);
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
    // Delete only once the detail page of this account is loaded, so the click cannot hit a stale page.
    await this.assertAccountDetailShown(accountName);
    await this.deleteAccount();
    await this.confirmDelete();
  }
  // AIO-300: full API-visible snapshots, including every collection page.
  private deleteApiBase() {
    const base = this.env.newAppBaseAPI.replace(/\/$/, '');
    expect(new URL(base).hostname, 'Delete regressions run only on staging').toBe('crm-practice-api.onrender.com');
    return base;
  }

  private async deleteHeaders(page: Page = this.page) {
    const token = await page.evaluate(() => sessionStorage.getItem('crm.token') ?? localStorage.getItem('crm.token'));
    expect(token, 'Authenticated role token').toBeTruthy();
    return { Authorization: `Bearer ${token}` };
  }

  private async deleteCollection(page: Page, collection: string, headers: Record<string, string>) {
    const rows: any[] = [];
    let totalPages = 1;
    for (let number = 1; number <= totalPages; number++) {
      const response = await page.request.get(`${this.deleteApiBase()}/api/${collection}?pageSize=100&page=${number}`, { headers });
      expect(response.status(), `GET ${collection} page ${number}: ${await response.text()}`).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body.data), `${collection} list envelope`).toBe(true);
      expect(Number.isInteger(body.totalPages)).toBe(true);
      totalPages = body.totalPages;
      rows.push(...body.data);
    }
    return rows.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }

  private async deleteSnapshot(page: Page, audit: boolean) {
    const headers = await this.deleteHeaders(page);
    const snapshot: Record<string, any[]> = {};
    for (const collection of [...ACCOUNT_DELETE.collections, ...(audit ? ['audit'] : [])]) {
      snapshot[collection] = await this.deleteCollection(page, collection, headers);
    }
    return snapshot;
  }

  private blockedAccountScope(snapshot: Record<string, any[]>) {
    const id = ACCOUNT_DELETE.blockedId;
    const dealIds = new Set(snapshot.deals.filter(row => row.accountId === id).map(row => row.id));
    return {
      accounts: snapshot.accounts.filter(row => row.id === id),
      contacts: snapshot.contacts.filter(row => row.accountId === id),
      deals: snapshot.deals.filter(row => row.accountId === id),
      quotes: snapshot.quotes.filter(row => row.accountId === id || dealIds.has(row.dealId)),
    };
  }

  async assertOpenDealDeleteHasNoWritesForBothRoles() {
    // Complete both modes for Admin before repeating with the saved Rep session.
    for (const role of ACCOUNT_DELETE.roles) {
      const context = role === 'admin' ? undefined : await this.page.context().browser()!.newContext({
        storageState: AuthManager.getInstance().getAuthFilePath(role),
      });
      const page = context ? await context.newPage() : this.page;
      try {
        if (context) await new Helpers(page).navigateTo(this.env.newAppBaseUrl);
        const before = await this.deleteSnapshot(page, role === 'admin');
        expect(before.accounts.some(row => row.id === ACCOUNT_DELETE.blockedId), `${role} seeded account exists`).toBe(true);
        const openDeals = before.deals.filter(row => row.accountId === ACCOUNT_DELETE.blockedId && !row.stage.startsWith('Closed'));
        expect(openDeals.length, `${role} seeded open deals precondition`).toBeGreaterThan(0);
        const headers = await this.deleteHeaders(page);
        for (const cascade of ACCOUNT_DELETE.cascadeModes) {
          const response = await page.request.delete(`${this.deleteApiBase()}/api/accounts/${ACCOUNT_DELETE.blockedId}?cascade=${cascade}`, { headers });
          expect(response.status(), `${role} cascade=${cascade}: ${await response.text()}`).toBe(409);
          expect(await response.json()).toMatchObject({ error: { code: 'open_deals' } });
          const after = await this.deleteSnapshot(page, role === 'admin');
          // The audit log is shared and capped, so parallel tests append and rotate rows; only rows this delete could write count.
          const { audit: auditBefore = [], ...dataBefore } = before;
          const { audit: auditAfter = [], ...dataAfter } = after;
          // Staging is shared: parallel specs create other accounts, so compare only records tied to the blocked account.
          expect(this.blockedAccountScope(dataAfter), `${role} cascade=${cascade} has no API-visible writes`).toEqual(this.blockedAccountScope(dataBefore));
          const knownIds = new Set(auditBefore.map(row => row.id));
          const accountName = before.accounts.find(row => row.id === ACCOUNT_DELETE.blockedId).name;
          const deleteRows = auditAfter.filter(row => !knownIds.has(row.id)
            && (/^(account|deal)\./.test(String(row.action)) || String(row.detail ?? '').includes(accountName)));
          expect(deleteRows, `${role} cascade=${cascade} wrote no account audit entry`).toEqual([]);
        }
      } finally {
        await context?.close();
      }
    }
  }

  async openDeleteRegressionAccount(id: string) {
    expect(new URL(this.env.newAppBaseUrl).hostname).toBe('automation-crm-7qil.onrender.com');
    await this.helpers.navigateTo(`${this.env.newAppBaseUrl.replace(/\/$/, '')}/accounts/${id}`);
    await this.helpers.assertVisible(this.page.getByTestId('account-detail-page'));
  }

  private deleteDialog() { return this.page.getByRole('dialog'); }

  async assertOpenDealDeleteBlocked() {
    const snapshot = await this.deleteSnapshot(this.page, false);
    const openDeals = snapshot.deals.filter(row => row.accountId === ACCOUNT_DELETE.blockedId && !row.stage.startsWith('Closed'));
    expect(openDeals.length, 'Seed account has open deals').toBeGreaterThan(0);
    await this.deleteAccount();
    await expect(this.page.getByTestId('delete-blocked-banner')).toContainText(ACCOUNT_DELETE.blockedGuidance);
    await expect(this.deleteDialog().getByRole('link')).toHaveCount(openDeals.length);
    for (const deal of openDeals) {
      await expect(this.deleteDialog().getByRole('link', { name: deal.name, exact: true })).toHaveAttribute('href', `/deals/${deal.id}`);
    }
    await this.helpers.click(this.deleteDialog().getByRole('button', { name: 'Close', exact: true }), 'Close blocked deletion');
    await expect(this.deleteDialog()).toHaveCount(0);
    await this.assertAccountDetailShown(snapshot.accounts.find(row => row.id === ACCOUNT_DELETE.blockedId).name);
    await this.helpers.assertURL(new RegExp(`/accounts/${ACCOUNT_DELETE.blockedId}$`));
  }

  private rejectedDeleteRequests = 0;
  private readonly rejectDeleteRoute = async (route: Route) => {
    if (route.request().method() !== 'DELETE') return route.continue();
    this.rejectedDeleteRequests++;
    await route.fulfill({ status: 500, json: ACCOUNT_DELETE.rejectedBody });
  };

  async rejectEmptyAccountDeletes() {
    const snapshot = await this.deleteSnapshot(this.page, false);
    expect(snapshot.accounts.some(row => row.id === ACCOUNT_DELETE.emptyId), 'Empty seed account exists').toBe(true);
    for (const collection of ['contacts', 'deals', 'quotes']) {
      expect(snapshot[collection].filter(row => row.accountId === ACCOUNT_DELETE.emptyId), `Empty seed has no ${collection}`).toEqual([]);
    }
    this.rejectedDeleteRequests = 0;
    await this.page.route(`**/api/accounts/${ACCOUNT_DELETE.emptyId}`, this.rejectDeleteRoute);
  }

  async openEmptyAccountDeleteDialog() {
    await this.deleteAccount();
    // With no related records this mode makes no unrelated collection updates.
    await this.helpers.setChecked(this.deleteDialog().getByRole('radio', { name: 'Delete the related contacts and closed deals too' }), true);
  }

  async confirmRejectedAccountDelete() {
    await this.helpers.click(this.page.getByTestId('confirm-delete-btn'), 'Delete account');
  }

  async assertRejectedDeleteRecovery(count: number) {
    await expect.poll(() => this.rejectedDeleteRequests).toBe(count);
    await expect(this.deleteDialog().getByRole('alert')).toHaveText(ACCOUNT_DELETE.recoveryError);
    await expect(this.page.getByTestId('confirm-delete-btn')).toHaveText('Delete account');
    await expect(this.page.getByTestId('confirm-delete-btn')).toBeEnabled();
    await expect(this.deleteDialog().getByRole('button', { name: 'Cancel', exact: true })).toBeEnabled();
    await this.helpers.assertURL(new RegExp(`/accounts/${ACCOUNT_DELETE.emptyId}$`));
    await this.helpers.assertVisible(this.page.getByTestId('account-detail-page').getByRole('heading', { level: 1 }));
  }

  async cancelRejectedAccountDelete() {
    const name = await this.getAccountNameFromDetailsPage();
    await this.helpers.click(this.deleteDialog().getByRole('button', { name: 'Cancel', exact: true }), 'Cancel deletion');
    await expect(this.deleteDialog()).toHaveCount(0);
    await this.assertAccountDetailShown(name);
    const snapshot = await this.deleteSnapshot(this.page, false);
    expect(snapshot.accounts.find(row => row.id === ACCOUNT_DELETE.emptyId)?.name).toBe(name);
  }

  async stopRejectingAccountDeletes() {
    await this.page.unroute(`**/api/accounts/${ACCOUNT_DELETE.emptyId}`, this.rejectDeleteRoute);
  }
}
