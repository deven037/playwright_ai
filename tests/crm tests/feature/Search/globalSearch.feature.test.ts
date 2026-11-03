import { expect, test } from "@fixtures/CrmFixtures";

const SEARCH_BUTTON = /Search leads, contacts, accounts/;
const LEAD_ONE_EMAIL = 'aarav.kapoor@example.com';
const LEAD_ONE_PHONE_TYPED = '(98649)-59172';

// Zephyr cases AIO-T68..T77 (linked to AIO-200); the case-to-test mapping is recorded on AIO-204.
test.describe('Global search @regression', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage, page }) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForDashBoardPage();
        await page.getByRole('button', { name: SEARCH_BUTTON }).click();
    });

    test('Results are grouped with at most 3 per type, totals and See all', async ({ page }) => {
        await page.getByTestId('command-input').fill('an');

        const list = page.getByRole('listbox', { name: 'Search results' });
        await expect(list.getByRole('group')).toHaveCount(4);
        for (const type of ['leads', 'contacts', 'accounts', 'deals']) {
            await expect(page.getByTestId(`search-result-${type}`)).toHaveCount(3);
            await expect(list.getByText(new RegExp(`See all \\d+ ${type}`))).toBeVisible();
        }
        await expect(list.getByRole('status')).toContainText('in 4 types');
    });

    test('Phone matches ignoring spaces, dashes and brackets, and email matches', async ({ page }) => {
        const input = page.getByTestId('command-input');

        await input.fill(LEAD_ONE_PHONE_TYPED);
        await expect(page.getByTestId('search-result-leads').first()).toContainText('Aarav Kapoor');

        await input.fill(LEAD_ONE_EMAIL);
        await expect(page.getByTestId('search-result-leads').first()).toContainText('Aarav Kapoor');
    });

    test('Opening a result goes to the record', async ({ page }) => {
        await page.getByTestId('command-input').fill('aarav');
        await page.getByTestId('search-result-leads').first().click();
        await expect(page).toHaveURL(/\/leads\/lead-1$/);
    });

    test('A term with no match shows the empty state', async ({ page }) => {
        await page.getByTestId('command-input').fill('zzzqqq');
        const list = page.getByRole('listbox', { name: 'Search results' });
        await expect(list.getByText('No matches for "zzzqqq"')).toBeVisible();
        await expect(list.getByText('Clear search')).toBeVisible();
    });
});

test('Global search: Viewer sees no Email or Phone and no email matching @regression', async ({
    crmLoginPage,
    dashboardPage,
    page
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithCustomCredentials('viewer@crm.com');
    await dashboardPage.waitForDashBoardPage();
    await page.getByRole('button', { name: SEARCH_BUTTON }).click();

    const input = page.getByTestId('command-input');
    await input.fill('aarav');
    const firstLead = page.getByTestId('search-result-leads').first();
    await expect(firstLead).toContainText('Aarav Kapoor');
    await expect(firstLead).not.toContainText('@');
    await expect(firstLead).not.toContainText('+91');

    await input.fill(LEAD_ONE_EMAIL);
    await expect(page.getByTestId('search-result-leads')).toHaveCount(0);
});
