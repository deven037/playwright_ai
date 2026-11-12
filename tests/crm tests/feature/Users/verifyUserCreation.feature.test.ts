import { expect, test } from "@fixtures/CrmFixtures";

test('@regression User Creation', async({
    crmLoginPage,
    adminPage,
    dashboardPage
}) => {

    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();

    await dashboardPage.clickAvatar();
    await adminPage.gotoSetup();
    await adminPage.gotoUsers();
    await adminPage.addUser();
    const userDetail = await adminPage.fillUserDetails("Viewer", true);
    await adminPage.createUser();

    await adminPage.logOut();

    const email = userDetail.email;
    await crmLoginPage.loginWithCustomCredentials(email);
    await dashboardPage.clickAvatar();

    expect(await adminPage.getLoggedInUserName()).toBe(userDetail.name);
})
