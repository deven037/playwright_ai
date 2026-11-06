import { Page } from "@playwright/test";
import { BasePage } from "../../core/BasePage";

export class ContactsPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async gotoContacts() {
    const contacts = this.page.locator("//a[contains(@class, 'nav-link') and contains(@href, '/contacts')]");
    await contacts.click();
    await this.waitForPageLoad();
  }

  async toggleListView(viewType?: boolean) {
    const listViewBtn = this.page.locator("//button[@data-testid='view-list']");

    if(viewType == true) {
      await listViewBtn.click();
    }

    const table = this.page.locator("//table[@class='table']");
    await this.helpers.assertVisible(table, 'Table is visible');
  }

  async clickNewContact() {
    const newContactBtn = this.page.locator("//div[@class='page-actions']/button[text()='+ New Contact']");
    await newContactBtn.click();
  }

  async fillContactDetails(jobTitle: string, accountName: string, tags: string[]) {
    const randomPhoneNumber = Math.floor(Math.random() * 1000000000).toString();
    const randomEmail = `contact_${Date.now()}@testmail.com`;
    const randomFullName = `Contact_${Date.now()}`;

    const fullNameInput = this.page.locator("//input[@data-testid='contact-name']");
    await this.helpers.fill(fullNameInput, randomFullName, 'Full Name Input');

    const emailInput = this.page.locator("//input[@data-testid='contact-email']");
    await this.helpers.fill(emailInput, randomEmail, 'Email Input');

    const phoneInput = this.page.locator("//input[@data-testid='contact-phone']");
    await this.helpers.fill(phoneInput, randomPhoneNumber, 'Phone Input');

    const jobTitleInput = this.page.locator("//input[@data-testid='contact-title']");
    await this.helpers.fill(jobTitleInput, jobTitle, 'Job Title Input');

    const accountDropDown = this.page.locator("//button[@data-testid='contact-account']");
    await this.helpers.click(accountDropDown, 'Account Dropdown');

    const accountNameInput = this.page.locator("//input[@class='select-search']");
    await this.helpers.fill(accountNameInput, accountName, 'Account Name Input');
    const accountNameOption = this.page.getByRole('option', { name: accountName });
    await this.helpers.click(accountNameOption, 'Account Name Option');

    const tagsInput = this.page.locator("//button[@data-testid='contact-tags']");
    await this.helpers.click(tagsInput, 'Tags Input');

    const tagOptions = this.page.getByRole('option');
    for (const tag of tags) {
      const tagOption = tagOptions.filter({ hasText: tag });
      await this.helpers.click(tagOption, `Tag Option: ${tag}`);
    }
    await this.helpers.click(tagsInput, 'Closed Tags Input');
  }

  async createContact() {
    const createContactBtn = this.page.locator("//div[@class='form-actions']/button[text()='Create contact']");
    await this.helpers.click(createContactBtn, 'Create Contact Button');
  }

  async getContactNameFromDetailsPage() {
    await this.page.waitForLoadState('domcontentloaded');
    const detailPage = this.page.locator("//div[@data-testid='contact-detail-page']");
    await this.helpers.waitForElement(detailPage, 'visible');
    const contactName = this.page.locator("//div[@class='detail-header']/div/h1");
    await this.helpers.assertVisible(contactName, 'Contact Name is visible');
    const name = await this.helpers.getText(contactName);
    return name;
  }

  async clickEditContact() {
    const editContactBtn = this.page.locator("//button[@data-testid='edit-contact-btn']");
    await this.helpers.click(editContactBtn, 'Edit Contact Button');
  }

  async deleteContact() {
    const deleteContactBtn = this.page.locator("//button[@data-testid='delete-contact-btn']");
    await this.helpers.click(deleteContactBtn, 'Delete Contact Button');
  }

  async confirmDelete(confirm: boolean) {
    const deletedMessage = this.page.locator("//div[@class='modal-body']/p");
    const text = await this.helpers.getText(deletedMessage);

    const notesMatch = text.match(/(\d+)\s+note\(s\)/);
    const filesMatch = text.match(/(\d+)\s+file\(s\)/);

    const notesCount = notesMatch ? Number(notesMatch[1]) : 0;
    const filesCount = filesMatch ? Number(filesMatch[1]) : 0;

    this.logger.info(`Notes Count: ${notesCount}, Files Count: ${filesCount}`);
    
    if (confirm) {
        const confirmDeleteBtn = this.page.locator("//button[@data-testid='confirm-delete-btn']");
        await this.helpers.click(confirmDeleteBtn, 'Confirm Delete Button');
    } else {
        const cancelBtn = this.page.locator("//footer[@class='modal-footer']/button[text()='Cancel']");
        await this.helpers.click(cancelBtn, 'Cancel Button');
    }
  }

  private searchedContactName = '';

  async searchInContactsTable(contactName: string) {
    this.searchedContactName = contactName;
    const searchInput = this.page.locator("//div[@class='toolbar']/input");
    await this.helpers.fill(searchInput, contactName, 'Search Input');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getFirstContactNameFromTable() {
    this.logger.info("Getting first contact name")
    const name = this.page.getByTestId('contacts-page').getByRole('link', { name: this.searchedContactName, exact: true });
    const contactName = await this.helpers.getText(name);
    return contactName;
  }

  async clickContactName() {
    const name = this.page.getByTestId('contacts-page').getByRole('link', { name: this.searchedContactName, exact: true });
    await this.helpers.click(name, "Contact Name");
  }

  async getNoRecordFoundMessage() {
    const emptyRecord = this.page.getByText(`No contacts match “${this.searchedContactName}”.`, { exact: true });
    const text = await this.helpers.getText(emptyRecord);
    this.logger.info(text);
    return text;
  }

  async chooseLayout(layoutName: string) {
    const layout = this.page.locator(`//span[@class='layout-picker-item-name' and text()='${layoutName}']`);
    await this.helpers.click(layout, "Layout");
  }
}