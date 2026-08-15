import { BasePage } from "@core/BasePage";
import { Locator, Page } from "@playwright/test";

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
    
    async searchInLeadsTable(leadName: string) {
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
        const column = this.page.locator(this.leadTableBlock(index));
        const text = await this.helpers.getText(column);
        return text;
    }

    async getStatusFromTable() {
        const column = this.page.locator("//tr[@class='row-clickable']/td[6]/span");
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

    async chooseLayout(layoutName: string) {
        const layout = this.page.locator(`//span[@class='layout-picker-item-name' and text()='${layoutName}']`);
        await this.helpers.click(layout, "Layout");
    }
}