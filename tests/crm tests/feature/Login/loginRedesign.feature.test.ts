import { test } from "@fixtures/CrmFixtures";

// Throwaway, validly formatted credentials: the CRM rejects them with HTTP 401.
const WRONG_EMAIL = 'qa.automation@example.com';
const WRONG_PASSWORD = 'NotThePassword1!';

test('AIO-T8: Login design and responsive layout @feature @regression', async ({ crmLoginPage }) => {
    // Step 1: desktop layout
    await crmLoginPage.setViewport(1440, 900);
    await crmLoginPage.goto();
    await crmLoginPage.assertLoginFormVisible();
    await crmLoginPage.assertNoHorizontalOverflow();

    // Step 2: 390, 375 and 768 px stay usable without horizontal overflow
    for (const width of [390, 375, 768]) {
        await crmLoginPage.setViewport(width, 800);
        await crmLoginPage.assertLoginFormVisible();
        await crmLoginPage.assertNoHorizontalOverflow();
    }

    // Step 3: logical tab order, visible controls and labels
    await crmLoginPage.setViewport(1440, 900);
    await crmLoginPage.assertFieldLabels();
    await crmLoginPage.assertTabOrder();
});

test('AIO-T9: Login required field validation @feature @smoke @regression', async ({ crmLoginPage }) => {
    await crmLoginPage.goto();

    // Step 1: empty submit
    await crmLoginPage.submitEmpty();
    await crmLoginPage.assertRequiredErrors();

    // Step 2: malformed email
    await crmLoginPage.submitMalformedEmail('not-an-email', WRONG_PASSWORD);
    await crmLoginPage.assertEmailValidationError();
});

test('AIO-T10: Login valid submission states @feature @regression', async ({ crmLoginPage }) => {
    await crmLoginPage.goto();
    await crmLoginPage.delayApiPosts(1500);

    // Step 1: loading state while the request is in flight
    await crmLoginPage.submitCredentials(WRONG_EMAIL, WRONG_PASSWORD);
    await crmLoginPage.assertBusy();

    // Step 2: failure feedback, entered values kept, form usable again
    await crmLoginPage.assertSignInFailure();
    await crmLoginPage.assertCredentialsKept(WRONG_EMAIL, WRONG_PASSWORD);
});

test('AIO-T11: Login remembered preference and recovery link @feature @regression', async ({ crmLoginPage }) => {
    await crmLoginPage.goto();

    // Step 1: Remember me responds to mouse and keyboard
    await crmLoginPage.toggleRememberMeByLabel();
    await crmLoginPage.toggleRememberMeByKeyboard();

    // Step 2: Forgot password? opens the reset view
    await crmLoginPage.openForgotPassword();
    await crmLoginPage.requestReset();
});
