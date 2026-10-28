import { expect, test } from "@fixtures/CrmFixtures";

test('@feature @regression AIO-T33: Sidebar links retain accessible names when collapsed', async ({
    crmLoginPage,
    dashboardPage,
    page
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();

    const sidebar = page.getByTestId('sidebar');
    const navigationLinks = sidebar.getByRole('link');
    await expect(navigationLinks.first()).toBeVisible();

    const expandedLinkLabels = (await navigationLinks.allTextContents())
        .map((label) => label.trim())
        .filter(Boolean);
    expect(expandedLinkLabels).toContain('Dashboard');
    expect(expandedLinkLabels).toContain('Leads');

    await page.getByTestId('sidebar-toggle').click();
    await expect(page.locator('.app-shell')).toHaveClass(/sidebar-collapsed/);

    for (const label of expandedLinkLabels) {
        await expect(sidebar.getByRole('link', { name: label, exact: true })).toHaveCount(1);
    }
});
