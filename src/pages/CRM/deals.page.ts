import { BasePage } from "@core/BasePage";
import { Page, expect } from "@playwright/test";
import { DEALS_VIEWPORT_HEIGHT, LIST_COLUMNS } from "../../data/deals.data";

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

  // --- Harbor redesign (AIO-392 / AIO-T192–T195) -----------------------------

  private stageColumn(stage: string) {
    return this.page.getByRole('group', { name: new RegExp(`^${stage}, \\d+ cards?$`) });
  }

  private boardCard(deal: string) {
    return this.page.getByRole('group', { name: deal, exact: true });
  }

  private moveSelect(deal: string) {
    return this.page.getByRole('combobox', { name: `Move ${deal} to…`, exact: true });
  }

  private openCardButton(deal: string) {
    return this.page.getByRole('button', { name: `Open ${deal}`, exact: true });
  }

  private get listRows() {
    return this.page.locator('tbody tr');
  }

  private get searchBox() {
    return this.page.getByRole('searchbox', { name: 'Search deals' });
  }

  private get stageFilter() {
    return this.page.getByRole('combobox', { name: 'Filter by stage' });
  }

  private amountHeader() {
    // The sorted column's label gains an arrow ("Amount ↓" / "Amount ↑").
    return this.page.getByRole('columnheader', { name: /^Amount( [↑↓])?$/ });
  }

  private get detailPage() {
    return this.page.getByTestId('deal-detail-page');
  }

  // Relative to the origin of the page the user is signed in on.
  private async gotoPath(path: string) {
    await this.helpers.navigateTo(new URL(path, this.page.url()).href);
  }

  async openBoard() {
    await this.gotoPath('/deals');
    await this.helpers.click(this.page.getByRole('button', { name: 'Board', exact: true }), 'Deals Board view');
    await this.helpers.assertVisible(this.page.getByTestId('kanban-board'), 'Deals board');
  }

  async openList() {
    await this.gotoPath('/deals?view=list');
    await this.helpers.assertVisible(this.searchBox, 'Deals list');
  }

  async showListView() {
    await this.helpers.click(this.page.getByRole('button', { name: 'List', exact: true }), 'List view');
    await this.helpers.assertVisible(this.searchBox, 'Deals list');
  }

  async reload() {
    await this.helpers.refreshPage();
  }

  async setViewport(width: number) {
    await this.helpers.setViewport({ width, height: DEALS_VIEWPORT_HEIGHT });
  }

  // --- Board ---

  async assertBoardColumns(stages: string[]) {
    for (const stage of stages) {
      await this.helpers.assertVisible(this.stageColumn(stage), `${stage} column`);
      await expect(this.stageColumn(stage).locator('.kanban-meta')).toHaveText(/^\d+ · \$[\d,]+$/);
    }
    await expect(this.page.getByRole('group', { name: /, \d+ cards?$/ })).toHaveCount(stages.length);
  }

  async assertCardDetails(deal: string, account: string, amount: string, probability: string, close: RegExp) {
    const card = this.boardCard(deal);
    await this.helpers.assertVisible(card, `${deal} card`);
    for (const text of [deal, account, amount, probability]) {
      await this.helpers.assertText(card, text);
    }
    await expect(card).toContainText(close);
    await this.helpers.assertVisible(this.moveSelect(deal), `Move ${deal} to…`);
  }

  async getStageCount(stage: string): Promise<number> {
    const meta = await this.helpers.getInnerText(this.stageColumn(stage).locator('.kanban-meta'), `${stage} count`);
    return Number(meta.split('·')[0].trim());
  }

  async moveDeal(deal: string, stage: string) {
    await this.helpers.selectOption(this.moveSelect(deal), stage, `Move ${deal} to…`);
  }

  async assertMoveToast(deal: string, stage: string) {
    const toast = this.page.getByRole('alert').or(this.page.getByRole('status'))
      .filter({ hasText: `"${deal}" moved to ${stage}.` });
    await this.helpers.assertVisible(toast.first(), 'Move toast');
  }

  async assertMoveMenuFocused(deal: string) {
    await this.helpers.assertFocused(this.moveSelect(deal), `Move ${deal} to… menu`);
  }

  async assertStageCount(stage: string, count: number) {
    await expect.poll(() => this.getStageCount(stage)).toBe(count);
  }

  async assertDealInStage(deal: string, stage: string) {
    await this.helpers.assertVisible(this.stageColumn(stage).getByRole('group', { name: deal, exact: true }), `${deal} in ${stage}`);
  }

  // Leaves the seed data as found if a step failed after the move.
  async restoreDealStage(deal: string, stage: string) {
    await this.openBoard();
    if (await this.helpers.isElementPresent(this.stageColumn(stage).getByRole('group', { name: deal, exact: true }))) return;
    await this.moveDeal(deal, stage);
    await this.assertDealInStage(deal, stage);
  }

  async openCardEditorWithKeyboard(deal: string) {
    await this.helpers.focus(this.openCardButton(deal), `Open ${deal}`);
    await this.helpers.pressKey(this.openCardButton(deal), 'Enter', `Open ${deal}`);
    await this.helpers.assertVisible(this.page.getByRole('dialog', { name: `Edit deal — ${deal}` }), 'Edit deal dialog');
  }

  async closeEditorWithEscape(deal: string) {
    await this.helpers.pressPageKey('Escape');
    await expect(this.page.getByRole('dialog')).toHaveCount(0);
    await this.helpers.assertFocused(this.openCardButton(deal), `Open ${deal}`);
  }

  // --- List ---

  async assertListColumns(columns: string[] = LIST_COLUMNS) {
    for (const column of columns) {
      await this.helpers.assertVisible(this.page.getByRole('columnheader', { name: column, exact: true }), `${column} header`);
    }
    await expect(this.page.getByRole('columnheader')).toHaveCount(columns.length);
  }

  async assertListRowCount(count: number) {
    await expect(this.listRows).toHaveCount(count);
  }

  async assertListViewSelected() {
    await this.helpers.assertURL(/view=list/);
    await this.helpers.assertAttribute(this.page.getByRole('button', { name: 'List', exact: true }), 'aria-pressed', 'true');
  }

  async assertNoColumnSorted() {
    await expect(this.page.locator('th[aria-sort="ascending"], th[aria-sort="descending"]')).toHaveCount(0);
  }

  async clickAmountHeader() {
    await this.helpers.click(this.amountHeader().getByRole('button'), 'Amount header');
  }

  async assertAmountSort(direction: 'ascending' | 'descending') {
    await this.helpers.assertAttribute(this.amountHeader(), 'aria-sort', direction);
  }

  async assertFirstRowAmount(amount: string) {
    await this.helpers.assertText(this.listRows.first().locator('td').nth(3), amount);
  }

  async filterByStage(stage: string) {
    await this.helpers.selectOption(this.stageFilter, stage, 'Filter by stage');
  }

  async assertAllRowsInStage(stage: string, count: number) {
    await this.assertListRowCount(count);
    const stages = await this.listRows.locator('td:nth-child(3)').allInnerTexts();
    expect(stages.every((s) => s.trim() === stage), `every row is ${stage}`).toBe(true);
  }

  async searchDeals(term: string) {
    await this.helpers.fill(this.searchBox, term, 'Search deals');
  }

  async assertAllRowsMatch(term: string) {
    await expect.poll(async () => {
      const names = await this.listRows.locator('td:first-child').allInnerTexts();
      return names.length > 0 && names.every((n) => n.toLowerCase().includes(term.toLowerCase()));
    }).toBe(true);
  }

  async assertNoMatchMessage(term: string) {
    await this.helpers.assertVisible(this.page.getByText(`No deals match “${term}”.`), 'No match message');
  }

  async clearFilters() {
    await this.helpers.click(this.page.getByRole('button', { name: 'Clear filters' }), 'Clear filters');
  }

  // --- Viewer and record ---

  async assertBoardAndListToggleVisible() {
    await this.helpers.assertVisible(this.page.getByRole('button', { name: 'Board', exact: true }), 'Board toggle');
    await this.helpers.assertVisible(this.page.getByRole('button', { name: 'List', exact: true }), 'List toggle');
  }

  async assertReadOnlyBoard(loadedDeal: string) {
    await this.helpers.assertVisible(this.boardCard(loadedDeal), 'board cards loaded');
    await expect(this.page.getByRole('button', { name: '+ New Deal' })).toHaveCount(0);
    await expect(this.page.getByRole('combobox', { name: /^Move .* to…$/ })).toHaveCount(0);
  }

  async openCardRecord(deal: string) {
    await this.helpers.click(this.boardCard(deal).locator('.kanban-card-title'), `${deal} card`);
    await this.helpers.assertVisible(this.detailPage, 'Deal record');
  }

  async assertRecordUrl(pattern: RegExp) {
    await this.helpers.assertURL(pattern);
  }

  async assertRecordDetails(deal: string, account: string, values: string[]) {
    await this.helpers.assertVisible(this.detailPage.getByRole('heading', { name: deal, level: 1 }), 'Deal name');
    await this.helpers.assertVisible(this.detailPage.getByRole('link', { name: account }), 'Account link');
    for (const value of values) {
      await this.helpers.assertText(this.detailPage, value);
    }
  }

  async assertNoRecordWriteActions() {
    await expect(this.detailPage.getByRole('button', { name: 'Edit', exact: true })).toHaveCount(0);
    await expect(this.detailPage.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0);
  }

  // --- Responsive ---

  async assertNoPageOverflow() {
    await expect.poll(() => this.helpers.getHorizontalOverflow()).toBeLessThanOrEqual(0);
  }

  // --- From main: Deals list default order (AIO-393 / AIO-T196) and board overflow (AIO-394 / AIO-T197) ---

  async gotoDealsList() {
    await this.gotoDeals();
    await this.helpers.click(this.page.getByRole('button', { name: 'List', exact: true }), 'List view');
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

  async getListAmounts(): Promise<number[]> {
    const rows = this.page.locator('table tbody tr');
    return rows.evaluateAll(trs =>
      trs.map(tr => Number((tr.textContent ?? '').match(/\$([\d,]+)/)?.[1]?.replace(/,/g, '') ?? NaN)));
  }

  async assertAmountHeaderSort(sort: 'ascending' | 'descending') {
    await expect(this.page.locator('table thead th', { hasText: 'Amount' })).toHaveAttribute('aria-sort', sort);
  }

  private get kanbanBoard() {
    return this.page.getByTestId('kanban-board');
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
