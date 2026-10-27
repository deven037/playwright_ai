import { expect, test } from "@fixtures/CrmFixtures";

test('@feature @regression Verify Ticket Creation, Status Workflow and Deletion', async ({
    crmLoginPage,
    dashboardPage,
    ticketsPage
}) => {
    let createdSubject: string | undefined;

    try {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForDashBoardPage();
        await dashboardPage.assertProfileIconVisible();

        await ticketsPage.gotoTickets();
        await ticketsPage.clickNewTicket();
        const expectedSubject = await ticketsPage.fillTicketDetails('Quinn Tester');
        createdSubject = expectedSubject;
        await ticketsPage.createTicket();

        const subject = await ticketsPage.getTicketSubjectFromDetailsPage();
        expect(subject).toBe(expectedSubject);
        await ticketsPage.assertStatus('Open');
        await ticketsPage.assertPriority('Medium');

        await ticketsPage.gotoTickets();
        await ticketsPage.assertTicketListed(subject);
        await ticketsPage.openTicketFromList(subject);

        await ticketsPage.moveTo('In Progress');
        await ticketsPage.moveTo('Resolved');
        await ticketsPage.moveTo('Closed');

        await ticketsPage.deleteTicket();
        await ticketsPage.confirmDelete();
        await ticketsPage.assertTicketNotListed(subject);
    } finally {
        if (createdSubject) {
            await ticketsPage.deleteTicketIfExists(createdSubject);
        }
    }
})
