import { expect, test } from "@fixtures/CrmFixtures";

test.use({ authRole: 'admin' });

test.describe('Leads list keyboard accessibility (AIO-61 AC3)', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage, leadsPage }) => {
        await dashboardPage.waitForPageLoad();
        await dashboardPage.assertProfileIconVisible();
        await leadsPage.goToLeads();
    });

    test('@regression AIO-T22: Leads keyboard rows, Convert action and aria-sort', async ({ page }) => {
        const rows = page.locator('tbody tr.row-clickable');
        await expect(rows.first()).toBeVisible();

        // Step 1: Tab until a lead row is focused, Enter opens the lead detail
        const firstRow = rows.first();
        await expect(firstRow).toHaveAttribute('tabindex', '0');
        await page.locator('body').click({ position: { x: 0, y: 0 } });
        let focused = false;
        for (let i = 0; i < 80 && !focused; i++) {
            await page.keyboard.press('Tab');
            focused = await page.evaluate(() => {
                const el = document.activeElement;
                return !!el && el.tagName === 'TR' && el.classList.contains('row-clickable');
            });
        }
        expect(focused, 'a lead row receives keyboard focus via Tab').toBe(true);
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/\/leads\/[^/]+$/);
        await expect(page.getByTestId('lead-detail-page')).toBeVisible();

        // Step 2: a visible Convert button on each row, no right-click needed
        await page.goBack();
        await expect(rows.first()).toBeVisible();
        const convertButtons = rows.first().getByRole('button', { name: /convert/i });
        await expect(convertButtons).toHaveCount(1);
        await expect(convertButtons).toBeVisible();

        // Step 3: focus Name header, Enter sorts and aria-sort is exposed
        const nameHeader = page.locator('th[tabindex="0"]').filter({ hasText: /^\s*Name/ });
        await expect(nameHeader).toHaveCount(1);
        await nameHeader.focus();
        await expect(nameHeader).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
        await page.keyboard.press('Enter');
        await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });
});
