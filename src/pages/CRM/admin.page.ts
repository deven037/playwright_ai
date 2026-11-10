import { BasePage } from "@core/BasePage";
import { Page } from "@playwright/test";

export class Admin extends BasePage {

    async waitForPageLoad(): Promise<any> {
        await this.page.waitForLoadState('domcontentloaded');
    }

    constructor(page: Page){
        super(page);
    }

    async gotoAdmin() {
        const adminBtn = this.page.locator("//a[contains(@class, 'nav-link') and contains(@href, '/admin')]");
        await this.helpers.click(adminBtn, 'Admin');
        await this.page.waitForLoadState('networkidle');
    }

    async gotoUsers() {
        const usersTab = this.page.locator("//a[@data-testid='setup-card-users']");
        await this.helpers.click(usersTab, 'Users');
        await this.page.waitForLoadState('networkidle');
    }

    async addUser() {
        const addBtn = this.page.locator("//button[text()='+ Add user']");
        await this.helpers.click(addBtn, "Add User");
        await this.waitForPageLoad();
    }

    async fillUserDetails(role: string, isActive?: boolean) {
        const modal = this.page.locator("//div[@class='modal']/div[@class='modal-body']");
        await this.helpers.waitForElement(modal, "visible");

        const nameInput = this.page.locator("//input[@data-testid='user-name']");
        const name = await this.helpers.fillWithReturn(nameInput, "test", "User Input");

        const emailInput = this.page.locator("//input[@data-testid='user-email']");
        const email = await this.helpers.fillWithReturn(emailInput, "test@crm.com", "Email Input");

        const roleBtn = this.page.locator("//button[@data-testid='user-role']");
        await this.helpers.click(roleBtn, "Select Role");

        const roleOption = this.page.getByRole('option', { name: role });
        await this.helpers.click(roleOption, 'Role Option');

        const activeCheckbox = this.page.locator("//label[@class='checkbox-label']");
        if(isActive == false){
            await activeCheckbox.uncheck();
        }
        return {name, email};
    }

    async createUser() {
        const createBtn = this.page.locator("//button[@data-testid='user-save-btn']");
        await this.helpers.click(createBtn, "Create User");
        await this.waitForPageLoad();
    }

    async logOut() {
        const avatar = this.page.locator("//button[@data-testid='avatar-menu']");
        await this.helpers.click(avatar, 'Profile Icon');

        const logout = this.page.locator("//button[@data-testid='logout-btn']");
        await this.helpers.click(logout, 'Log Out');
    }

    async getLoggedInUserName() {
        const loggedInUserName = this.page.locator("//div[@class='avatar-info']/strong");
        const name = await this.helpers.getText(loggedInUserName);
        return name;
    }

     async gotoSetup() {
        const setup = this.page.locator("//button[@data-testid='setup-menu-item']");
        await this.helpers.click(setup, 'Setup');   
    }

    /** Opens Status Codes from the ToolBox panel on the Leads page (must already be on /leads). */
    async gotoStatusCodesFromLeads() {
        await this.page.getByRole('link', { name: 'Status Codes', exact: true }).click();
        await this.page.getByTestId('status-codes-page').waitFor({ state: 'visible' });
    }

    /** Option-count text of a status code set card, e.g. "5 option(s) · Built-in". */
    statusSetMeta(setName: string) {
        return this.page.locator(`//*[normalize-space(text())='${setName}']/following-sibling::*[1]`);
    }

    /** Opens a status code set for editing and returns its options (one per line in the textarea). */
    async openStatusSet(setName: string): Promise<string[]> {
        await this.page.getByText(setName, { exact: true }).click();
        const options = this.page.getByTestId('status-codes-options');
        await options.waitFor({ state: 'visible' });
        const text = await options.inputValue();
        return text.split('\n').map((o) => o.trim()).filter(Boolean);
    }

    async saveStatusSet(options: string[]) {
        await this.page.getByTestId('status-codes-options').fill(options.join('\n'));
        await this.page.getByTestId('status-codes-save-btn').click();
        await this.page.getByTestId('status-codes-options').waitFor({ state: 'hidden' });
    }
}
