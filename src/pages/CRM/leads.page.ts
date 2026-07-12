import { BasePage } from "@core/BasePage";
import { Page } from "@playwright/test";

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

    async fillLeadDetails(statusCode: string, sourceOption: string, productName: string, leadEstVal: number) {
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

        const productDropDown = this.page.locator("//button[@data-testid='lead-product']");
        await this.helpers.click(productDropDown, 'Product Dropdown');    
        const productsList = this.page.getByRole('option', { name: productName });
        await this.helpers.click(productsList, 'Product Option');

        const sourceDropDown = this.page.locator("//button[@class='select-trigger']").nth(1);
        await this.helpers.click(sourceDropDown, 'Source Dropdown');
        const sourceOptions = this.page.getByRole('option', { name: sourceOption });
        await this.helpers.click(sourceOptions, 'Source Option');

        const leadValue = this.page.locator("//input[@data-testid='lead-value']");
        await this.helpers.fill(leadValue, leadEstVal.toString(), 'Lead Value Input');

        const createLeadBtn = this.page.locator("//div[@class='form-actions']/button").nth(1);
        await this.helpers.click(createLeadBtn, 'Create Lead Button');
        await this.page.waitForLoadState('networkidle');
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
        const name = this.page.locator("(//tr[contains(@class,'row-clickable')]/td)[2]");
        await this.helpers.waitForElement(name, 'visible');
        return await this.helpers.getText(name);
    }
}