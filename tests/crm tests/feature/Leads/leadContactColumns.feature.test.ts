import { expect, test } from '@fixtures/CrmFixtures';

test.describe('AIO-T136: Viewer contact columns', () => {
    test.use({ role: 'viewer' });
    test('AIO-T136: Viewer sees no Email/Phone column or value @regression', async ({ page, crmLoginPage, leadsPage }) => {
        await crmLoginPage.goto();
        await leadsPage.goToLeads();
        await leadsPage.assertLeadsTableLoaded();
        const headers = await leadsPage.getColumnHeaders();
        expect(headers).toHaveLength(9);
        expect(headers.some(h => /^(Email|Phone)\b/i.test(h))).toBe(false);
        const rows = page.locator('tbody tr.row-clickable');
        for (const row of await rows.all()) {
            expect(await row.innerText()).not.toMatch(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
            await expect(row.locator('td')).toHaveCount(9);
        }
    });
});

for (const role of ['admin', 'rep'] as const) {
    test.describe(`AIO-T137: ${role} contact columns`, () => {
        test.use({ role });
        test(`AIO-T137: ${role} sees Email and Phone with values @regression`, async ({ page, crmLoginPage, leadsPage }) => {
            await crmLoginPage.goto();
            await leadsPage.goToLeads();
            await leadsPage.assertLeadsTableLoaded();
            const headers = await leadsPage.getColumnHeaders();
            const cells = page.locator('tbody tr.row-clickable').first().locator('td');
            for (const column of ['Email', 'Phone']) {
                const index = headers.findIndex(h => new RegExp(`^${column}\\b`, 'i').test(h));
                expect(index, `${column} header exists`).toBeGreaterThanOrEqual(0);
                await expect(cells.nth(index)).not.toHaveText('');
            }
        });
    });
}
