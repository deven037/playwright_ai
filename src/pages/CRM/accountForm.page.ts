import { BasePage } from '@core/BasePage';
import { Route, expect } from '@playwright/test';
import { ACCOUNT_FORM_MESSAGES, CREATE_BUTTON, REJECTED_CREATE_BODY } from '../../data/accountForm.data';

export class AccountFormPage extends BasePage {
    private createRequests = 0;
    private readonly createApiPattern = '**/api/accounts';
    private readonly rejectCreateRoute = async (route: Route) => {
        if (route.request().method() !== 'POST') return route.continue();
        this.createRequests++;
        return route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify(REJECTED_CREATE_BODY),
        });
    };

    private get nameInput() { return this.page.getByTestId('account-name'); }
    private get websiteInput() { return this.page.getByTestId('account-website'); }
    private get employeesInput() { return this.page.getByTestId('account-employees'); }
    private get revenueInput() { return this.page.getByTestId('account-revenue'); }
    private get createButton() { return this.page.getByRole('button', { name: CREATE_BUTTON, exact: true }); }
    private get saveErrorBanner() {
        return this.page.getByRole('alert').filter({ hasText: ACCOUNT_FORM_MESSAGES.saveError });
    }

    async rejectAccountCreation() {
        this.createRequests = 0;
        await this.page.route(this.createApiPattern, this.rejectCreateRoute);
    }

    async stopRejectingAccountCreation() {
        await this.page.unroute(this.createApiPattern, this.rejectCreateRoute);
    }

    async fillName(name: string) {
        await this.helpers.fill(this.nameInput, name, 'Account Name Input');
    }

    async fillWebsite(website: string) {
        await this.helpers.fill(this.websiteInput, website, 'Website Input');
    }

    async fillEmployees(value: string) {
        await this.helpers.fill(this.employeesInput, value, 'Employees Input');
    }

    async fillRevenue(value: string) {
        await this.helpers.fill(this.revenueInput, value, 'Revenue Input');
    }

    async submit() {
        await this.helpers.click(this.createButton, 'Create Account Button');
    }

    async assertSaveErrorShown() {
        await expect(this.saveErrorBanner).toBeVisible();
    }

    async assertCreateButtonReset() {
        await expect(this.createButton).toBeVisible();
        await expect(this.createButton).toBeEnabled();
    }

    async assertNameKept(name: string) {
        await expect(this.nameInput).toHaveValue(name);
    }

    async assertCreateRequests(count: number) {
        await expect.poll(() => this.createRequests).toBe(count);
    }

    async assertEmployeesError() {
        const error = this.page.locator('#account-employees-error');
        await expect(error).toHaveText(ACCOUNT_FORM_MESSAGES.employeesNegative);
        await expect(this.employeesInput).toHaveAttribute('aria-invalid', 'true');
    }

    async assertRevenueError() {
        const error = this.page.locator('#account-revenue-error');
        await expect(error).toHaveText(ACCOUNT_FORM_MESSAGES.revenueNegative);
        await expect(this.revenueInput).toHaveAttribute('aria-invalid', 'true');
    }

    async assertNegativeValuesKept(employees: string, revenue: string) {
        await expect(this.employeesInput).toHaveValue(employees);
        await expect(this.revenueInput).toHaveValue(revenue);
    }

    async assertNumericFieldsLabelled() {
        await expect(this.page.getByRole('spinbutton', { name: 'Employees' })).toBeVisible();
        await expect(this.page.getByRole('spinbutton', { name: 'Annual revenue ($)' })).toBeVisible();
        await expect(this.page.getByRole('textbox', { name: 'Phone' })).toBeVisible();
    }
}
