import { expect, test } from "@fixtures/CrmFixtures";

test('@feature @regression Verify Contact Deletion', async ({
    crmLoginPage,
    dashboardPage,
    contactsPage
}) => {

    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();
    await dashboardPage.assertProfileIconVisible();

    await contactsPage.gotoContacts();
    await contactsPage.clickNewContact();
    await contactsPage.chooseLayout('Default');
    await contactsPage.fillContactDetails('Augomation Engineer', 'Quantica', ['partner']);
    await contactsPage.createContact();

    const contactName = await contactsPage.getContactNameFromDetailsPage();
    await contactsPage.gotoContacts();
    await contactsPage.searchInContactsTable(contactName);

    expect(await contactsPage.getFirstContactNameFromTable()).toBe(contactName);

    await contactsPage.clickContactName();
    await contactsPage.deleteContact();
    await contactsPage.confirmDelete(true);

    await contactsPage.searchInContactsTable(contactName);
    expect(await contactsPage.getNoRecordFoundMessage()).toContain(contactName);
})