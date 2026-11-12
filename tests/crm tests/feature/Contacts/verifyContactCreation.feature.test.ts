import { expect, test } from "@fixtures/CrmFixtures";

test('@feature @smoke @regression Verify Contact Creation', async ({
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
    await contactsPage.fillContactDetails('Augomation Engineer', 'Quantica', ['partner']);
    await contactsPage.createContact();

    const contactName = await contactsPage.getContactNameFromDetailsPage();
    await contactsPage.gotoContacts();
    await contactsPage.searchInContactsTable(contactName);

    expect(await contactsPage.getFirstContactNameFromTable(contactName)).toBe(contactName);
})
