import { expect, test } from "@fixtures/CrmFixtures";

test.describe('Leads pager overflow at 375 px (AIO-137)', () => {
    test.beforeEach(async ({ crmLoginPage, dashboardPage, leadsPage }) => {
        await crmLoginPage.goto();
        await crmLoginPage.loginWithDefaultCredentials();
        await dashboardPage.waitForPageLoad();
        await dashboardPage.assertProfileIconVisible();
        await leadsPage.goToLeads();
    });

    test('@regression AIO-T26: Leads pager does not overflow the page at 375 px', async ({ page }) => {
        // Step 1: 375 px wide viewport, Leads shows the seeded leads on page 1 of several
        await page.setViewportSize({ width: 375, height: 812 });
        await page.reload();
        const pagination = page.getByTestId('pagination');
        await expect(pagination).toBeVisible();
        await expect(pagination).toContainText(/\d+ lead\(s\) · page 1 of \d+/);
        const summary = (await pagination.locator('span.muted').innerText()).match(/(\d+) lead\(s\) · page 1 of (\d+)/);
        expect(summary, 'pager summary text is present').not.toBeNull();
        expect(Number(summary![1]), 'at least the 75 seeded leads').toBeGreaterThanOrEqual(75);
        expect(Number(summary![2]), 'at least 8 pages at 10 per page').toBeGreaterThanOrEqual(8);

        // Step 2: document scrollWidth is no larger than the viewport; pager stays inside it
        const controls = pagination.locator('.pagination-controls');
        await expect(controls).toBeVisible();
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth, 'document scrollWidth <= 375').toBeLessThanOrEqual(375);
        const controlsRight = await controls.evaluate((el) => el.getBoundingClientRect().right);
        expect(controlsRight, 'pager controls end inside the viewport').toBeLessThanOrEqual(375);
    });
});
