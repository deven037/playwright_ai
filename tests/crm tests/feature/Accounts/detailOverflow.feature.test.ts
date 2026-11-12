import { expect, test } from '@fixtures/CrmFixtures';
import type { Page } from '@playwright/test';

async function assertNoOverflow(page: Page) {
    await expect.poll(() => page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
    }))).toEqual({ scroll: page.viewportSize()!.width, client: page.viewportSize()!.width });
    const outside = await page.locator('.detail-list dd').evaluateAll(elements =>
        elements.filter(element => {
            const box = element.getBoundingClientRect();
            return box.left < 0 || box.right > document.documentElement.clientWidth ||
                element.scrollWidth > element.clientWidth + 1;
        }).length);
    expect(outside, 'detail values fit inside the viewport and their column').toBe(0);
}

test('AIO-T157/T158: Account Details fit at 375/768/1440 @regression', async ({ page, crmLoginPage }) => {
    await crmLoginPage.goto();
    for (const width of [375, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const id of ['account-1', 'account-2', 'account-3']) {
            await page.goto(new URL('/accounts/' + id, page.url()).href);
            await expect(page.getByTestId('account-detail-page')).toBeVisible();
            await expect(page.locator('.detail-list dd').first()).toBeVisible();
            await assertNoOverflow(page);
        }
    }
});

test('AIO-T159: unbroken website wraps at 375 @regression', async ({ page, crmLoginPage }) => {
    await crmLoginPage.goto();
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(new URL('/accounts/account-1', page.url()).href);
    await expect(page.getByTestId('account-detail-page')).toBeVisible();
    const website = page.locator('.detail-list dd a').first();
    await expect(website).toBeVisible();
    // Reproduce the manual edge case in the rendered DOM without persisting account changes.
    await website.evaluate(element => { element.textContent = 'https://' + 'a'.repeat(100) + '.example'; });
    await assertNoOverflow(page);
});

test('AIO-T160: Contact Details fit at 375/768/1440 @regression', async ({ page, crmLoginPage }) => {
    await crmLoginPage.goto();
    await page.goto(new URL('/contacts', page.url()).href);
    await page.locator('tbody tr.row-clickable').first().click();
    await expect(page.getByTestId('contact-detail-page')).toBeVisible();
    for (const width of [375, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.locator('.detail-list dd').first()).toBeVisible();
        await assertNoOverflow(page);
    }
});
