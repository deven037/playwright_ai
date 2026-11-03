import { expect, test } from '@fixtures/CrmFixtures';

test.use({ trace: 'on-first-retry' });
test.describe.configure({ retries: 0 });

test('AIO-T94: Same-term See all restores edited list filters on Leads, Contacts and Accounts @regression', async ({
    crmLoginPage, dashboardPage, page
}) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginWithDefaultCredentials();
    await dashboardPage.waitForDashBoardPage();

    const panel = page.getByTestId('command-bar');
    const input = panel.getByRole('combobox', { name: 'Search leads, contacts, accounts and deals' });
    const cases = [
        { module: 'leads', term: 'kiara', placeholder: 'Search name, company, email…' },
        { module: 'contacts', term: 'example', placeholder: 'Search contacts…' },
        { module: 'accounts', term: 'an', placeholder: 'Search accounts…' }
    ];

    for (const scenario of cases) {
        await test.step(scenario.module + ': repeat See all after editing the list', async () => {
            const seeAll = panel.getByTestId('search-see-all-' + scenario.module);
            const openResults = async () => {
                await page.getByTestId('global-search').click();
                await input.fill(scenario.term);
                await expect(input).toHaveAttribute('aria-busy', 'false');
                await expect(seeAll).toBeVisible();
            };
            await openResults();
            if (scenario.module === 'leads') {
                await expect(seeAll).toHaveText('See all 4 leads');
            }
            await seeAll.click();
            await expect(panel).toHaveCount(0);
            await expect(page).toHaveURL(new RegExp('/' + scenario.module + '\\?q=' + scenario.term + '$'));
            const list = page.getByTestId(scenario.module + '-page');
            if (scenario.module === 'contacts') {
                await list.getByTestId('view-list').click();
            }
            const box = list.getByPlaceholder(scenario.placeholder, { exact: true });
            const rows = list.getByRole('row').filter({ has: page.getByRole('cell') });
            await expect(box).toHaveValue(scenario.term);
            await expect(rows.filter({ hasText: new RegExp(scenario.term, 'i') })).not.toHaveCount(0);
            if (scenario.module === 'leads') {
                await expect(rows).toHaveCount(4);
                await expect(list.getByTestId('pagination')).toContainText('4 lead(s) · page 1 of 1');
            }
            const originalRows = await rows.allTextContents();
            const originalUrl = page.url();

            await box.fill('zzz');
            await expect(list.getByText(/No .* match/)).toBeVisible();
            if (scenario.module === 'leads') {
                await expect(list.getByTestId('pagination')).toContainText('0 lead(s) · page 1 of 1');
            }
            await expect(page).toHaveURL(originalUrl);

            await openResults();
            await seeAll.click();
            await expect(panel).toHaveCount(0);
            await expect(page).toHaveURL(originalUrl);
            await expect(box).toHaveValue(scenario.term);
            await expect(rows).toHaveText(originalRows);
            if (scenario.module === 'leads') {
                await expect(rows).toHaveCount(4);
                await expect(list.getByTestId('pagination')).toContainText('4 lead(s) · page 1 of 1');
            }
        });
    }
});
