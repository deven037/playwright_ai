import { expect, test } from '@fixtures/CrmFixtures';

const emailPattern = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/;
const phonePattern = /(?<!\d)(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}(?!\d)|(?<!\d)\d{10}(?!\d)/;

test('AIO-T137: Admin and Sales Rep still see Email and Phone @regression', async ({ crmLoginPage, dashboardPage, leadsPage, adminPage }) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginAsRole('admin');
    await dashboardPage.waitForDashBoardPage();
    await leadsPage.goToLeads();

    const adminHeaders = await leadsPage.getLeadTableHeaders();
    expect(adminHeaders).toContain('Email');
    expect(adminHeaders).toContain('Phone');
    const adminContactValues = await leadsPage.getFirstLeadContactValues();
    expect(adminContactValues.email).not.toBe('');
    expect(adminContactValues.phone).not.toBe('');

    await adminPage.logOut();
    await crmLoginPage.loginAsRole('rep');
    await dashboardPage.waitForDashBoardPage();
    await leadsPage.goToLeads();

    const repHeaders = await leadsPage.getLeadTableHeaders();
    expect(repHeaders).toContain('Email');
    expect(repHeaders).toContain('Phone');
    const repContactValues = await leadsPage.getFirstLeadContactValues();
    expect(repContactValues.email).not.toBe('');
    expect(repContactValues.phone).not.toBe('');
});

test('AIO-T136: Viewer sees no Email/Phone column or value @smoke @regression', async ({ crmLoginPage, dashboardPage, leadsPage }) => {
    await crmLoginPage.goto();
    await crmLoginPage.loginAsRole('viewer');
    await dashboardPage.waitForDashBoardPage();
    await leadsPage.goToLeads();

    const headers = await leadsPage.getLeadTableHeaders();
    expect(headers).not.toContain('Email');
    expect(headers).not.toContain('Phone');
    for (const header of ['Name', 'Company', 'Status', 'Source', 'Owner', 'Value', 'Created', 'Actions']) {
        expect(headers).toContain(header);
    }

    const rows = await leadsPage.getLeadVisibleRowTexts();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
        expect(row).not.toMatch(emailPattern);
        expect(row).not.toMatch(phonePattern);
    }

    await leadsPage.searchLeads('AIO-258-no-matching-lead');
    const emptyStateColumnSpan = await leadsPage.getLeadEmptyStateColumnSpan();
    expect(emptyStateColumnSpan).toBe(await leadsPage.getLeadTableColumnCount());
});
