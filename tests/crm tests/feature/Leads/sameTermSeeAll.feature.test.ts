import { expect, test } from "@fixtures/CrmFixtures";

test('AIO-T94: Same-term See all restores an edited list filter across modules @smoke @regression', async ({
    crmLoginPage, dashboardPage, page
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();

    const cases = [
        { module: 'leads', term: 'kiara', count: 4, next: 'chawla', empty: 'No leads match the current filters.' },
        { module: 'contacts', term: 'example', count: 40, next: 'ra', empty: 'No contacts match “zzz”.' },
        { module: 'accounts', term: 'an', count: 4, next: 'er', empty: 'No accounts match “zzz”.' },
    ];
    for (const item of cases) {
        await test.step(item.module + ': reset same term and change term', async () => {
            const seeAll = async (term: string) => {
                await page.getByTestId('global-search').click();
                await page.getByTestId('command-input').fill(term);
                const option = page.getByTestId('search-see-all-' + item.module);
                await expect(option).toBeVisible();
                const label = await option.innerText();
                await option.click();
                await expect(page).toHaveURL(new RegExp('/' + item.module + '\\?q=' + term + '$'));
                await expect(page.getByRole('searchbox')).toHaveValue(term);
                return label;
            };
            const label = await seeAll(item.term);
            expect(label).toBe('See all ' + item.count + ' ' + item.module);
            const main = page.getByRole('main');
            const records = item.module === 'contacts'
                ? main.getByRole('button', { name: 'View profile', exact: true })
                : main.locator('tbody tr');
            await expect(records).toHaveCount(item.count);
            const original = await main.innerText();

            await page.getByRole('searchbox').fill('zzz');
            await expect(main.getByText(item.empty, { exact: true })).toBeVisible();
            if (item.module === 'leads') {
                await expect(main.getByText('0 lead(s) · page 1 of 1', { exact: true })).toBeVisible();
            }
            await seeAll(item.term);
            await expect(records).toHaveCount(item.count);
            await expect.poll(() => main.innerText()).toBe(original);

            const changedLabel = await seeAll(item.next);
            const changedCount = Number(changedLabel.match(/See all (\d+)/)?.[1]);
            expect(changedCount).toBeGreaterThan(3);
            await expect(records).toHaveCount(changedCount);
            await expect.poll(() => main.innerText()).not.toBe(original);
        });
    }
});
