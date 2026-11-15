import { test, expect } from "@fixtures/CrmFixtures";

test.use({ role: 'admin', trace: 'retain-on-failure' });
test.skip(process.env.TARGET_ENV === 'production', 'Creates and deletes a ticket on staging only');

test('AIO-T233: Deleted ticket disappears from Recently Accessed @feature @regression', async ({
    crmLoginPage,
    dashboardPage,
    ticketsPage
}) => {
    let createdSubject: string | undefined;
    let deleted = false;

    try {
        await crmLoginPage.goto();
        await dashboardPage.waitForDashBoardPage();
        await dashboardPage.assertProfileIconVisible();
        await ticketsPage.gotoTickets();
        await ticketsPage.clickNewTicket();
        createdSubject = await ticketsPage.fillTicketDetails('Quinn Tester');
        await ticketsPage.createTicket();
        expect(await ticketsPage.getTicketSubjectFromDetailsPage()).toBe(createdSubject);
        await ticketsPage.moveTo('In Progress');
        await ticketsPage.moveTo('Resolved');

        // Establish the entry before exercising the standalone detail delete callback.
        await ticketsPage.gotoTickets();
        await ticketsPage.assertTicketInRecentlyAccessed(createdSubject);
        await ticketsPage.openTicketFromRecentlyAccessed(createdSubject);
        await ticketsPage.assertStatus('Resolved');
        await ticketsPage.moveTo('Closed');
        await ticketsPage.deleteTicket();
        await ticketsPage.confirmDelete();
        deleted = true;
        await ticketsPage.assertTicketsListShown();

        await ticketsPage.assertTicketNotInRecentlyAccessed(createdSubject);
        await ticketsPage.reloadTickets();
        await ticketsPage.assertTicketNotInRecentlyAccessed(createdSubject);
    } finally {
        if (createdSubject && !deleted) {
            await ticketsPage.deleteTicketIfExists(createdSubject);
        }
    }
});
