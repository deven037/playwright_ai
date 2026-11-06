import { expect, test } from "@fixtures/CrmFixtures";

test.use({ authRole: 'admin' });

test('AIO-T79: Escape closes search from focused error actions and restores header focus @smoke @regression', async ({
    crmLoginPage,
    dashboardPage,
    page
}) => {
    await dashboardPage.waitForDashBoardPage();

    // The live API now succeeds; force the error precondition without changing server data.
    let searchRequests = 0;
    await page.route('**/api/search?**', async route => {
        searchRequests++;
        await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Controlled search failure for AIO-T79' })
        });
    });

    const opener = page.getByTestId('global-search');
    const panel = page.getByTestId('command-bar');
    const input = page.getByRole('combobox', { name: 'Search leads, contacts, accounts and deals' });
    const retry = panel.getByRole('button', { name: 'Try again', exact: true });
    const close = panel.getByRole('button', { name: 'Close', exact: true });

    await opener.focus();
    await page.keyboard.press('Control+k');
    await expect(input).toBeFocused();
    await input.fill('an');
    await expect(panel.getByText('Search did not finish', { exact: true })).toBeVisible();
    await expect(retry).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(opener).toBeFocused();

    // Nearby regression: header opening, retry retains the term, and Esc bubbles from Close.
    await opener.click();
    await input.fill('an');
    await expect(retry).toBeFocused();
    const previousRequests = searchRequests;
    await retry.click();
    await expect.poll(() => searchRequests).toBeGreaterThan(previousRequests);
    await expect(input).toHaveAttribute('aria-busy', 'false');
    await expect(retry).toBeFocused();
    await expect(input).toHaveValue('an');
    await close.focus();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(opener).toBeFocused();

    await opener.click();
    await expect(input).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(opener).toBeFocused();
});
