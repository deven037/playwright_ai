import { test, expect } from '../../../../src/fixtures/CrmFixtures';

const HARBOR_PRIMARY = '#1d3a6e';
const AMBER_PRIMARY = '#f2b705';

const readBankTone = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.dataset.bankTone);

const readBankPrimary = (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--bank-primary').trim().toLowerCase()
  );

test('@feature @regression AIO-T37: Unset VITE_BANK_TONE keeps Harbor default and sets no data-bank-tone', async ({ page, crmLoginPage }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await crmLoginPage.goto();
  await expect(page.getByTestId('login-submit')).toBeVisible();
  expect(consoleErrors).toEqual([]);

  expect(await readBankTone(page)).toBeUndefined();
  expect(await readBankPrimary(page)).toBe(HARBOR_PRIMARY);
});

test('@feature @regression AIO-T38: data-bank-tone=amber reaches the amber override; unknown value falls back to Harbor', async ({ page, crmLoginPage }) => {
  await crmLoginPage.goto();
  await expect(page.getByTestId('login-submit')).toBeVisible();

  await page.evaluate(() => { document.documentElement.dataset.bankTone = 'amber'; });
  await expect.poll(() => readBankPrimary(page)).toBe(AMBER_PRIMARY);

  await page.evaluate(() => { document.documentElement.dataset.bankTone = 'bogus'; });
  await expect.poll(() => readBankPrimary(page)).toBe(HARBOR_PRIMARY);

  await page.evaluate(() => { delete document.documentElement.dataset.bankTone; });
  await expect.poll(() => readBankPrimary(page)).toBe(HARBOR_PRIMARY);
});

test('@feature @smoke @regression AIO-T39: App still boots and signs in; dashboard has no overflow at 375/768/1440 px', async ({ page, crmLoginPage, dashboardPage }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await crmLoginPage.goto();
  await crmLoginPage.loginWithDefaultCredentials();
  await dashboardPage.waitForDashBoardPage();
  await dashboardPage.assertDashboardUrl();

  expect(consoleErrors).toEqual([]);

  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    await expect
      .poll(
        () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
        { message: `horizontal overflow at ${width}px` }
      )
      .toBeLessThanOrEqual(0);
  }
});
