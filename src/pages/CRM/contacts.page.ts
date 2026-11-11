import { Page } from "@playwright/test";
import { CONTACT_FORM } from '../../data/contacts.data';
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

  async searchInContactsTable(contactName: string) {
    const searchInput = this.page.locator("//div[@class='toolbar']/input");
    await this.helpers.fill(searchInput, contactName, 'Search Input');
    await this.page.waitForLoadState('domcontentloaded');
  }

  private contactNameLink(contactName: string) {
    const xpathName = this.toXPathLiteral(contactName.trim());
    return this.page.locator(`//a[starts-with(@href, '/contacts/contact-') and normalize-space(.)=${xpathName}]`);
  }

  private toXPathLiteral(value: string) {
    const parts = value.split("'");
    if (parts.length === 1) return `'${value}'`;
    return `concat(${parts.map(part => `'${part}'`).join(`, "'", `)})`;
  }

  async getFirstContactNameFromTable(contactName: string) {
    this.logger.info("Getting searched contact name");
    return this.helpers.getText(this.contactNameLink(contactName));
  }

  async clickContactName(contactName: string) {
    await this.helpers.click(this.contactNameLink(contactName), "Contact Name");
  }

  async getNoRecordFoundMessage() {
    const emptyRecord = this.page.locator("//main//div[@class='empty-cell']");
    const text = await this.helpers.getText(emptyRecord);
    this.logger.info(text);
    return text;
  }

  private contactCreateRequests = 0;

  async observeContactCreation() {
    this.page.on('request', request => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/contacts') {
        this.contactCreateRequests++;
      }
    });
  }

  async getContactCreateRequestCount() {
    return this.contactCreateRequests;
  }

  async assertAccessibleEmptyForm() {
    const form = this.page.getByTestId('contact-form-page');
    await this.helpers.assertVisible(form);
    for (const name of CONTACT_FORM.labels) {
      const input = form.getByRole('textbox', { name });
      await this.helpers.assertVisible(input);
      await this.helpers.assertEmpty(input);
    }
  }

  async assertEmptySubmitErrorsAndFocus() {
    const form = this.page.getByTestId('contact-form-page');
    const name = form.getByRole('textbox', { name: CONTACT_FORM.labels[0] });
    const email = form.getByRole('textbox', { name: CONTACT_FORM.labels[1] });
    await this.helpers.assertVisible(form.getByText(CONTACT_FORM.nameError, { exact: true }));
    await this.helpers.assertVisible(form.getByText(CONTACT_FORM.emailError, { exact: true }));
    await this.helpers.assertAttribute(name, 'aria-invalid', 'true');
    await this.helpers.assertAttribute(email, 'aria-invalid', 'true');
    await this.helpers.assertAccessibleDescription(name, CONTACT_FORM.nameError);
    await this.helpers.assertAccessibleDescription(email, CONTACT_FORM.emailError);
    await this.helpers.assertFocused(name);
    await this.helpers.assertURL(/\/contacts\/new(?:\?|$)/);
    await this.helpers.assertVisible(form);
  }

  async chooseLayout(layoutName: string) {
    const layout = this.page.locator(`//span[@class='layout-picker-item-name' and text()='${layoutName}']`);
    await this.helpers.click(layout, "Layout");
  }
}
