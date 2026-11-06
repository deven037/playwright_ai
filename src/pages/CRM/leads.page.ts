import { BasePage } from "@core/BasePage";
import { expect, Locator, Page, Response } from "@playwright/test";

import { CONVERTED_SEARCH, convertedSearchLead } from '../../data/leads.data';
import { SEARCH_LABEL } from '../../data/search.data';

export class LeadsPage extends BasePage {
    waitForPageLoad(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
    constructor(page: Page) {
        super(page);
    }

    async goToLeads() {
        const leadsBtn = this.page.locator("//a[contains(@class, 'nav-link') and contains(@href, '/leads')]");
        await this.helpers.click(leadsBtn, 'Leads');
        await this.page.waitForLoadState('networkidle');
    }

    async getPageUrl() {
        const url = await this.getCurrentUrl();
        return url;
    }

    async createNewLead() {
        const newLeadBtn = this.page.locator("//div[@class='page-actions']/button").nth(1);
        await this.helpers.click(newLeadBtn, 'New Lead');
        await this.page.waitForLoadState('networkidle');
    }

    async fillLeadDetails(statusCode: string, sourceOption: string, leadEstVal: number, productName?: string, ) {
        const leadNameWithTimeStamps = `Lead_${Date.now()}`;
        const companyNameWithTimeStamps = `Company_${Date.now()}`;
        const phoneRandomNumber = Math.floor(Math.random() * 1000000000).toString();

        const leadNameInput = this.page.locator("//input[@data-testid='lead-name']");
        await this.helpers.fill(leadNameInput, leadNameWithTimeStamps, 'Lead Name Input');

        const companyNameInput = this.page.locator("//input[@data-testid='lead-company']");
        await this.helpers.fill(companyNameInput, companyNameWithTimeStamps, 'Company Name Input');

        const emailInput = this.page.locator("//input[@data-testid='lead-email']");
        await this.helpers.fill(emailInput, `${leadNameWithTimeStamps}@testmail.com`, 'Email Input');

        const phoneInput = this.page.locator("//input[@data-testid='lead-phone']");
        await this.helpers.fill(phoneInput, phoneRandomNumber, 'Phone Input');

        const leadStatusDropDown = this.page.locator("//button[@data-testid='lead-status']");
        await this.helpers.click(leadStatusDropDown, 'Lead Status Dropdown');
        const leadStatusOption = this.page.getByRole('option', { name: statusCode });
        await this.helpers.click(leadStatusOption, 'Lead Status Option');
        
        if(productName) {
            const productDropDown = this.page.locator("//button[@data-testid='lead-product']");
            await this.helpers.click(productDropDown, 'Product Dropdown');    
            const productsList = this.page.getByRole('option', { name: productName });
            await this.helpers.click(productsList, 'Product Option');
        }

        const sourceDropDown = this.page.locator("//button[@class='select-trigger']").nth(1);
        await this.helpers.click(sourceDropDown, 'Source Dropdown');
        const sourceOptions = this.page.getByRole('option', { name: sourceOption });
        await this.helpers.click(sourceOptions, 'Source Option');
        
        const leadValue = this.page.locator("//input[@data-testid='lead-value']");
        await this.helpers.fill(leadValue, leadEstVal.toString(), 'Lead Value Input');
    }

    async createLead() {
        const createLeadBtn = this.page.locator("//div[@class='form-actions']/button").nth(1);
        const saveLeadBtn = this.page.locator("//button[@data-testid='save-lead-btn']");

        if(await createLeadBtn.isVisible()) {
            await this.helpers.click(createLeadBtn, 'Create Lead Button');
            await this.page.waitForLoadState('networkidle');
        }else if(await saveLeadBtn.isVisible()) {
            await this.helpers.click(saveLeadBtn, 'Save Lead Button');
            await this.page.waitForLoadState('domcontentloaded');
        }
    }

    async getLeadNameFromDetailsPage(){
        await this.page.waitForLoadState('domcontentloaded');
        const detailPage = this.page.locator("//div[@data-testid='lead-detail-page']");
        await this.helpers.waitForElement(detailPage, 'visible');
        await this.page.waitForLoadState('networkidle');
        const leadNameHeader = this.page.locator("//div[@class='page-header']/h1");
        await this.helpers.assertVisible(leadNameHeader, 'Lead Name Header is visible');
        const leadName = await this.helpers.getText(leadNameHeader);
        console.log(`Lead Name from Details Page: ${leadName}`);
        return leadName;
    }
    
    private currentSearchTerm = '';

    async searchInLeadsTable(leadName: string) {
        this.currentSearchTerm = leadName;
        const searchInput = this.page.locator("//div[@class='toolbar']/input");
        await this.helpers.fill(searchInput, leadName, 'Search Input');
        await this.page.waitForLoadState('domcontentloaded');
    }

    async getFirstLeadNameFromTable() {
        this.logger.info("Getting top lead name")
        const name = this.page.locator("(//tr[contains(@class,'row-clickable')]/td)[2]");
        await this.helpers.waitForElement(name, 'visible');
        return await this.helpers.getText(name);
    }

    async clickLeadName() {
        const name = this.page.locator("(//tr[contains(@class,'row-clickable')]/td)[2]");
        await this.helpers.click(name, "Lead Name");
    }

    async editlead() {
        const leadDetail = this.page.locator("//div[@data-testid='lead-detail-page']");
        await this.helpers.waitForElement(leadDetail, "visible");
        const editBtn = this.page.locator("//button[@data-testid='edit-lead-btn']");
        await this.helpers.click(editBtn, "Edit");
        await this.page.waitForLoadState('domcontentloaded');
    }

    async editStatusCode(statusCode: string) {
        const leadStatusDropDown = this.page.locator("//button[@class='select-trigger']").first();
        await this.helpers.click(leadStatusDropDown, 'Lead Status Dropdown');
        const leadStatusOption = this.page.getByRole('option', { name: statusCode });
        await this.helpers.waitForElement(leadStatusOption, "visible");
        await this.helpers.click(leadStatusOption, 'Lead Status Option');
    }

    async editSource(sourceOption: string) {
        const sourceDropDown = this.page.locator("//button[@class='select-trigger']").nth(1);
        await this.helpers.click(sourceDropDown, 'Source Dropdown');
        const sourceOptions = this.page.getByRole('option', { name: sourceOption });
        await this.helpers.click(sourceOptions, 'Source Option');
    }

    async editLeadValue(leadEstVal: number) {
        const leadValue = this.page.locator("//input[@type='number']");
        await this.helpers.fill(leadValue, leadEstVal.toString(), 'Lead Value Input');
    }

    async editProduct(productIndex: number) {
        const productDropDown = this.page.locator("//button[@class='select-trigger']").nth(2);
        await this.helpers.click(productDropDown, 'Product Dropdown');    
        const product = this.page.getByRole('option').nth(productIndex);
        await this.helpers.click(product, 'Product Option');
    }

    async getProductName() {
        const product = this.page.locator("//button[@data-testid='lead-product']/span[1]");
        const name = await this.helpers.getText(product);
        console.log(`Product Name on Lead Form = ${name}`)
        return name;
    }

    async getLeadStatus() {
        await this.page.waitForLoadState('domcontentloaded');
        const detailPage = this.page.locator("//div[@data-testid='lead-detail-page']");
        await this.helpers.waitForElement(detailPage, 'visible');
        const status = this.page.locator("//span[@data-testid='lead-detail-status']");
        const name = await this.helpers.getText(status);
        await this.helpers.assertVisible(status, "Status");
        return name;
    }

    async getLeadAssignTo() {
        await this.page.waitForLoadState('domcontentloaded');
        const detailPage = this.page.locator("//div[@data-testid='lead-detail-page']");
        await this.helpers.waitForElement(detailPage, 'visible');
        const owner = this.page.locator("//dl[@class='detail-list']/dd").nth(4);
        const name = await this.helpers.getText(owner);
        await this.helpers.assertVisible(owner, "Owner");
        return name;
    }

    private detailPageBlock(index: number): Locator {
        return this.page.locator(`//dl[@class='detail-list']//dd[${index}]`);
    }

    async getTextOfUpdatedField(index: number) {
        const field = this.detailPageBlock(index);
        const text = await this.helpers.getText(field);
        return text;
    }

    private leadTableBlock(index: number) {
        const locatorString = `//tr[@class='row-clickable']/td[${index}]`;
        return locatorString;
    }

    async getTextFromLeadTableColumns(index: number) {
        const column = this.convertedSearchRow(this.currentSearchTerm).getByRole('cell').nth(index - 1);
        const text = await this.helpers.getText(column);
        return text;
    }

    async getStatusFromTable() {
        const column = this.convertedSearchRow(this.currentSearchTerm).getByRole('cell').nth(5);
        const status = await this.helpers.getText(column);
        return status;
    }

    async deleteLead() {
        const leadDetail = this.page.locator("//div[@data-testid='lead-detail-page']");
        await this.helpers.waitForElement(leadDetail, "visible");
        const deleteBtn = this.page.locator("//button[@data-testid='delete-lead-btn']");
        await this.helpers.click(deleteBtn, "Delete");
        await this.page.waitForLoadState('domcontentloaded');
    }

    async confirmDelete(confirm: boolean) {
        const deleteModal = this.page.locator("//div[@class='modal']");
        await this.helpers.waitForElement(deleteModal);

        if(confirm == true) {
            const confirmDeleteBtn = this.page.locator("//button[@data-testid='confirm-delete-btn']");
            await this.helpers.click(confirmDeleteBtn, "Confirm Delete");
        }else{
            const cancelBtn = this.page.locator("//button[@class='btn' and text()='Cancel']");
            await this.helpers.click(cancelBtn, "Cancel");
        }
    }

    async getNoRecordFoundMessaage() {
        const record = this.page.locator("//table[@class='table']/tbody/tr").first();
        const text = await this.helpers.getText(record);
        this.logger.info(text);
    }

    async openConvertWizardForFirstLead() {
        const row = this.page.locator("//tr[contains(@class,'row-clickable')]").first();
        await this.helpers.waitForElement(row, 'visible');
        await row.click({ button: 'right' });
        const convertItem = this.page.getByText('Convert lead…');
        await this.helpers.click(convertItem, 'Convert lead menu item');
        const wizardTitle = this.page.getByText(/Convert lead — Step 1 of 3/);
        await this.helpers.assertVisible(wizardTitle, 'Convert wizard step 1');
    }

    async wizardNext() {
        const nextBtn = this.page.getByRole('button', { name: 'Next ›', exact: true });
        await this.helpers.click(nextBtn, 'Wizard Next');
    }

    async getWizardContactName() {
        // Contact name is a <label for="convert-contact-name"> bound to its input
        const input = this.page.getByLabel('Contact name', { exact: true });
        return await input.inputValue();
    }

    async setWizardAccountName(accountName: string) {
        const input = this.page.locator("//span[text()='Account name']/following-sibling::input");
        await this.helpers.fill(input, accountName, 'Wizard Account Name');
    }

    async enableWizardDeal(dealName: string) {
        const checkbox = this.page.getByLabel('Also create a deal for this conversion');
        await checkbox.check();
        const dealInput = this.page.locator("//span[text()='Deal name']/following-sibling::input");
        await this.helpers.fill(dealInput, dealName, 'Wizard Deal Name');
    }

    async finishConversion() {
        const finishBtn = this.page.locator("//button[@data-testid='wizard-finish']");
        await this.helpers.click(finishBtn, 'Finish conversion');
    }

    async assertConvertedToast(leadName: string) {
        const toast = this.page.getByText(`Lead "${leadName}" converted successfully.`);
        await this.helpers.assertVisible(toast, 'Converted toast');
    }

    async chooseLayout(layoutName: string) {
        const layout = this.page.locator(`//span[@class='layout-picker-item-name' and text()='${layoutName}']`);
        await this.helpers.click(layout, "Layout");
    }
    private readonly createdSearchRecords = new Map<string, string>();
    private readonly captureSearchRecord = (response: Response) => {
        const request = response.request();
        if (!response.ok() || request.method() !== 'POST' ||
            !/\/api\/(leads|contacts|accounts|deals)$/.test(new URL(request.url()).pathname)) return;
        const record = request.postDataJSON();
        if (typeof record?.name !== 'string' || !record.name.startsWith(CONVERTED_SEARCH.prefix)) return;
        this.createdSearchRecords.set(
            request.url() + '/' + encodeURIComponent(record.id),
            request.headers()['authorization'] ?? '',
        );
    };

    async trackConvertedSearchRecords() {
        this.page.on('response', this.captureSearchRecord);
    }

    async cleanupConvertedSearchRecords() {
        this.page.off('response', this.captureSearchRecord);
        for (const [url, authorization] of [...this.createdSearchRecords].reverse()) {
            const response = await this.page.request.delete(url, { headers: { authorization } });
            expect(response.status(), 'Remove only AIO-T100 records created in this browser').toBe(204);
            this.createdSearchRecords.delete(url);
        }
    }

    async createConvertedSearchLead() {
        const record = convertedSearchLead();
        await this.helpers.click(this.page.getByRole('button', { name: '+ New Lead', exact: true }));
        await this.chooseLayout('Default');
        await this.helpers.fill(this.page.getByTestId('lead-name'), record.name);
        await this.helpers.fill(this.page.getByTestId('lead-company'), record.company);
        await this.helpers.fill(this.page.getByTestId('lead-email'), record.email);
        await this.helpers.fill(this.page.getByTestId('lead-phone'), CONVERTED_SEARCH.phone);
        await this.helpers.click(this.page.getByTestId('lead-status'));
        await this.helpers.click(this.page.getByRole('option', { name: CONVERTED_SEARCH.newStatus, exact: true }));
        await this.helpers.click(this.page.getByRole('button', { name: 'Create lead', exact: true }));
        await this.helpers.waitForElement(this.page.getByTestId('lead-detail-page'));
        await this.helpers.assertText(this.page.getByRole('heading', { level: 1 }), record.name);
        return record.name;
    }

    private convertedSearchRow(name: string) {
        return this.page.getByTestId('leads-page').getByRole('row').filter({
            has: this.page.getByRole('cell', { name, exact: true }),
        });
    }

    async assertSearchLeadStatus(name: string, status: string) {
        const row = this.convertedSearchRow(name);
        await expect(row).toHaveCount(1);
        await this.helpers.assertVisible(row.getByRole('cell', { name: status, exact: true }));
        await expect(this.page.getByTestId('leads-page').getByRole('checkbox', { name: /^Select AioT100/ })).toHaveCount(1);
    }

    async openSearchLeadConversion(name: string) {
        const row = this.convertedSearchRow(name);
        await this.helpers.waitForElement(row);
        await this.helpers.click(row, 'Open lead context menu', { button: 'right' });
        await this.helpers.click(this.page.getByText('Convert lead…', { exact: true }));
        await this.helpers.assertVisible(this.page.getByLabel('Contact name', { exact: true }));
    }

    async editSearchLeadToConverted(name: string) {
        await this.helpers.click(this.convertedSearchRow(name).getByRole('cell', { name, exact: true }));
        await this.editlead();
        await this.helpers.click(this.page.getByTestId('lead-detail-page').getByRole('button', { name: CONVERTED_SEARCH.newStatus, exact: true }));
        await this.helpers.click(this.page.getByRole('option', { name: CONVERTED_SEARCH.convertedStatus, exact: true }));
        await this.helpers.click(this.page.getByTestId('save-lead-btn'));
        await this.helpers.assertText(this.page.getByTestId('lead-detail-status'), CONVERTED_SEARCH.convertedStatus);
    }

    async nameSearchConversionAccount(name: string) {
        await this.setWizardAccountName(name + 'Account');
    }

    async nameSearchConversionDeal(name: string) {
        await this.enableWizardDeal(name + 'Deal');
    }

    async searchForMissingConvertedLead(name: string) {
        await this.searchInLeadsTable(name + 'missing');
        await this.helpers.assertVisible(this.page.getByText(CONVERTED_SEARCH.noMatches, { exact: true }));
    }

    async assertConvertedSearchVariants(name: string) {
        // Force a visible empty state before each matching query so assertions cannot
        // accidentally pass against rows from before the list's debounce completes.
        for (const query of [name.slice(0, -4), name.toUpperCase()]) {
            await this.searchInLeadsTable(name + 'missing');
            await this.helpers.assertVisible(this.page.getByText(CONVERTED_SEARCH.noMatches, { exact: true }));
            await this.searchInLeadsTable(query);
            await this.assertSearchLeadStatus(name, CONVERTED_SEARCH.convertedStatus);
        }
    }

    async assertClearingConvertedSearchRestoresList() {
        await this.helpers.fill(this.page.getByTestId('leads-page').getByRole('searchbox'), '');
        await expect(this.page.getByTestId('leads-page').getByRole('searchbox')).toHaveValue('');
        await expect(this.page.getByTestId('leads-page').getByRole('checkbox', { name: /^Select AioT100/ })).toHaveCount(2);
    }

    async assertGlobalSearchExcludesConverted(name: string) {
        await this.helpers.click(this.page.getByTestId('global-search'));
        const panel = this.page.getByTestId('command-bar');
        const input = panel.getByRole('combobox', { name: SEARCH_LABEL });
        // Response ties the assertion to this query, rather than the previous results.
        const completed = this.page.waitForResponse(response => {
            const url = new URL(response.url());
            return url.pathname === '/api/search' && url.searchParams.get('q') === name && response.ok();
        });
        await this.helpers.fill(input, name);
        await completed;
        await expect(input).toHaveAttribute('aria-busy', 'false');
        await expect(input).toHaveAttribute('aria-invalid', 'false');
        await expect(panel.getByTestId('search-result-leads')).toHaveCount(0);
        await expect(panel.getByTestId('search-see-all-leads')).toHaveCount(0);
        await this.helpers.pressKey(input, 'Escape');
        await expect(panel).toHaveCount(0);
    }

}
