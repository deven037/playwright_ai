import { expect, test } from "@fixtures/CrmFixtures";

const VIEWER_EMAIL = 'viewer@crm.com';

test('@regression AIO-T24: Viewer sees the Leads table and no Export CSV, even when /api/users returns 403', async ({
    page,
    crmLoginPage,
    dashboardPage,
    leadsPage }) => {

    const uncaughtErrors: string[] = [];
    page.on('pageerror', (error) => uncaughtErrors.push(error.message));

    await crmLoginPage.goto();
    await crmLoginPage.loginWithCustomCredentials(VIEWER_EMAIL);
    await dashboardPage.waitForPageLoad();

    // Step 1: the table renders rows (10 on the first page), not a blank page
    await leadsPage.goToLeads();
    const rows = page.locator('tr.row-clickable');
    await expect(rows).toHaveCount(10);
    await expect(page.getByRole('alert')).toHaveCount(0);

    // Step 2: Export CSV is not offered; + New Lead remains
    await expect(page.getByRole('button', { name: 'Export CSV' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '+ New Lead' })).toBeVisible();

    // Step 3: a 403 on /api/users may appear, but no uncaught permission error and the table still renders
    expect(uncaughtErrors.filter((message) => message.includes('You do not have permission'))).toEqual([]);
    await expect(rows).toHaveCount(10);
});
