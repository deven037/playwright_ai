import { test } from "@fixtures/CrmFixtures";

test('AIO-T213: Deleted contact is removed from Recently Accessed @feature @regression', async ({
    crmLoginPage,
    dashboardPage,
    contactsPage
}) => {

    await crmLoginPage.goto();
    await dashboardPage.waitForDashBoardPage();
    await dashboardPage.assertProfileIconVisible();

    await contactsPage.gotoContacts();
    await contactsPage.clickNewContact();
    await contactsPage.chooseLayout('Default');
    await contactsPage.fillContactDetails('Automation Engineer', 'Quantica', ['partner']);
    await contactsPage.createContact();
    const contactName = await contactsPage.getContactNameFromDetailsPage();

    await contactsPage.deleteContact();
    await contactsPage.confirmDelete(true);
    await contactsPage.assertContactsListShown();

    await contactsPage.assertContactNotInRecentlyAccessed(contactName);
})
