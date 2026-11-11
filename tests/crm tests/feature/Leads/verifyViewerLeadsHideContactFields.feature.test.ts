import { expect, test } from "@fixtures/CrmFixtures";
import { EMAIL_VALUE_PATTERN, HIDDEN_LEAD_COLUMNS, PHONE_VALUE_PATTERN, VIEWER_EMAIL } from "../../../../src/data/leads.data";

test.describe('Viewer does not see lead Email and Phone (AIO-149 / AIO-61 AC4)', () => {
    test('AIO-T27: Leads: role without permission does not see Email and Phone @regression', async ({ crmLoginPage, dashboardPage, leadsPage }) => {
        // Step 1: sign in as the Viewer and open Leads, the table loads
        await crmLoginPage.goto();
        await crmLoginPage.loginWithCustomCredentials(VIEWER_EMAIL);
        await dashboardPage.waitForPageLoad();
        await dashboardPage.assertProfileIconVisible();
        await leadsPage.goToLeads();
        await leadsPage.assertLeadsTableLoaded();

        // Step 2: no Email or Phone header and no email/phone value in the first row
        const headers = await leadsPage.getColumnHeaders();
        expect(headers.length, 'the table still has columns').toBeGreaterThan(0);
        for (const column of HIDDEN_LEAD_COLUMNS) {
            expect(headers.some((h) => new RegExp(`^${column}\\b`, 'i').test(h)), `no ${column} header`).toBe(false);
        }
        const cells = await leadsPage.getFirstRowCellTexts();
        for (const cell of cells) {
            expect(cell).not.toMatch(EMAIL_VALUE_PATTERN);
            expect(cell).not.toMatch(PHONE_VALUE_PATTERN);
        }
    });
});
