import { BasePage } from "@core/BasePage";
import { Locator, Page, errors, expect } from "@playwright/test";

export class TicketsPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  // A ticket opens either as the full detail page or, from the inbox, in the reading pane.
  // Both carry the same status buttons, so actions run in whichever view is shown.
  private get ticketView(): Locator {
    return this.page.getByTestId('ticket-detail-page').or(this.page.getByTestId('ticket-reading-pane'));
  }

  async waitForPageLoad() {
    await this.page.getByTestId('tickets-page').waitFor({ state: 'visible' });
  }

  async gotoTickets() {
    const tickets = this.page.locator("//a[contains(@class, 'nav-link') and contains(@href, '/tickets')]");
    await this.helpers.click(tickets, 'Tickets');
    await this.waitForPageLoad();
  }

  async clickNewTicket() {
    const newTicketBtn = this.page.getByRole('button', { name: '+ New Ticket' });
    await this.helpers.click(newTicketBtn, 'New Ticket Button');
  }

  async fillTicketDetails(requester: string) {
    const subject = `Ticket_${Date.now()}`;

    const subjectInput = this.page.getByTestId('ticket-subject');
    await this.helpers.fill(subjectInput, subject, 'Ticket Subject Input');

    const requesterInput = this.page.getByTestId('ticket-requester');
    await this.helpers.fill(requesterInput, requester, 'Ticket Requester Input');

    return subject;
  }

  async createTicket() {
    const createBtn = this.page.getByRole('button', { name: 'Create ticket' });
    await this.helpers.click(createBtn, 'Create Ticket Button');
  }

  async getTicketSubjectFromDetailsPage() {
    const detailPage = this.page.getByTestId('ticket-detail-page');
    await this.helpers.waitForElement(detailPage, 'visible');
    const subject = detailPage.locator('h1');
    await this.helpers.assertVisible(subject, 'Ticket Subject is visible');
    return await this.helpers.getText(subject);
  }

  async assertPriority(priority: string) {
    await expect(this.ticketView.getByTestId('ticket-priority')).toContainText(priority);
  }

  async assertStatus(status: string) {
    await expect(this.ticketView.getByTestId('ticket-status')).toHaveText(status);
  }

  /** Moves the open ticket to the given status with its workflow button. */
  async moveTo(status: 'Open' | 'In Progress' | 'Resolved' | 'Closed') {
    const button = this.ticketView.getByRole('button', { name: status, exact: true });
    await this.helpers.click(button, `Move ticket to ${status}`);
    await this.assertStatus(status);
  }

  async deleteTicket() {
    const deleteBtn = this.ticketView.getByTestId('delete-ticket-btn');
    await this.helpers.click(deleteBtn, 'Delete Ticket Button');
  }

  async confirmDelete() {
    const confirmBtn = this.page.getByTestId('confirm-delete-btn');
    await this.helpers.click(confirmBtn, 'Confirm Delete Button');
    await this.page.waitForURL(/\/tickets$/);
    await this.waitForPageLoad();
  }

  // "Recently Accessed" keeps the deleted subject, so list checks are scoped to the inbox.
  private inboxRow(subject: string) {
    return this.page.getByTestId('ticket-inbox').getByRole('button').filter({ hasText: subject });
  }

  async assertTicketListed(subject: string) {
    await expect(this.inboxRow(subject).first()).toBeVisible();
  }

  async assertTicketNotListed(subject: string) {
    await expect(this.page.getByTestId('ticket-inbox')).toBeVisible();
    await expect(this.inboxRow(subject)).toHaveCount(0);
  }

  async openTicketFromList(subject: string) {
    await this.helpers.click(this.inboxRow(subject).first(), 'Ticket in inbox');
    await this.page.getByTestId('ticket-reading-pane').waitFor({ state: 'visible' });
  }

  /** Cleanup: closes then removes the ticket if it is still listed; does nothing if already deleted. */
  async deleteTicketIfExists(subject: string) {
    await this.gotoTickets();
    try {
      await this.inboxRow(subject).first().waitFor({ state: 'visible', timeout: 5000 });
    } catch (error) {
      // Only a timeout means "not listed"; any other failure is a real problem
      if (error instanceof errors.TimeoutError) {
        return;
      }
      throw error;
    }
    await this.openTicketFromList(subject);
    // Only a Closed ticket can be deleted; Open and Resolved tickets offer Closed directly or via Resolved
    const closed = this.ticketView.getByRole('button', { name: 'Closed', exact: true });
    if (await this.ticketView.getByTestId('ticket-status').innerText() !== 'Closed') {
      if (!(await closed.isVisible())) {
        await this.moveTo('Resolved');
      }
      await this.moveTo('Closed');
    }
    await this.deleteTicket();
    await this.confirmDelete();
  }
}
