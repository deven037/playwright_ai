import { expect, test } from "@fixtures/CrmFixtures";

test('AIO-T97: See all preserves company matches and excludes industry matches @smoke @regression', async ({
    crmLoginPage, dashboardPage, page
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();

    const opener = page.getByTestId('global-search');
    const input = page.getByRole('combobox', { name: 'Search leads, contacts, accounts and deals' });
    await opener.click();
    await input.fill('ro');
    const contacts = page.getByRole('group', { name: 'Contacts 5 matches', exact: true });
    await expect(contacts.getByText('Meera Iyer', { exact: true })).toBeVisible();
    await expect(contacts.getByText(/Aurora Analytics/)).toBeVisible();
    await contacts.getByRole('option', { name: 'See all 5 contacts', exact: true }).click();
    await expect(page).toHaveURL(/\/contacts\?q=ro$/);
    await expect(page.getByRole('searchbox', { name: 'Search contacts…' })).toHaveValue('ro');
    await page.getByRole('button', { name: 'List view', exact: true }).click();
    const contactRows = page.locator('tbody tr');
    await expect(contactRows).toHaveCount(5);
    for (const name of ['Rohan Chawla', 'Meera Iyer', 'Rohan Rao', 'Kabir Bose', 'Diya Desai']) {
        await expect(contactRows.filter({ hasText: name })).toHaveCount(1);
    }

    await opener.click();
    await input.fill('in');
    await page.getByRole('option', { name: 'See all 4 accounts', exact: true }).click();
    await expect(page).toHaveURL(/\/accounts\?q=in$/);
    const accountSearch = page.getByRole('searchbox', { name: 'Search accounts…' });
    await expect(accountSearch).toHaveValue('in');
    const accountRows = page.locator('tbody tr');
    await expect(accountRows).toHaveCount(4);
    for (const name of ['Crestline Inc', 'Northwind Traders', 'Silverline Bank', 'Kite Financial']) {
        await expect(accountRows.filter({ hasText: name })).toHaveCount(1);
    }

    // AIO-227 / approved knowledge #1238: repeat See all resets an edited list box.
    await accountSearch.fill('other');
    await expect(accountRows).toHaveCount(0);
    await opener.click();
    await input.fill('in');
    await page.getByRole('option', { name: 'See all 4 accounts', exact: true }).click();
    await expect(accountSearch).toHaveValue('in');
    await expect(accountRows).toHaveCount(4);

    // Formatted phone and a new query on the same destination route.
    await opener.click();
    await input.fill('98 7');
    await page.getByRole('option', { name: 'See all 4 accounts', exact: true }).click();
    await expect(accountSearch).toHaveValue('98 7');
    await expect(accountRows).toHaveCount(4);
    for (const name of ['Zenith Corp', 'Quantica', 'Ironleaf Media', 'Coral Peak']) {
        await expect(accountRows.filter({ hasText: name })).toHaveCount(1);
    }
});
