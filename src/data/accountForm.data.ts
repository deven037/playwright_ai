export const ACCOUNT_FORM_DRAFT = {
    name: 'QA Draft Account',
    negativeName: 'QA Test Co',
    website: 'https://qa-test.example.com',
    negativeEmployees: '-5',
    negativeRevenue: '-10',
};

export const REJECTED_CREATE_BODY = { error: { code: 'server_error', message: 'Simulated save failure' } };

export const ACCOUNT_FORM_MESSAGES = {
    saveError: 'Account couldn’t be saved. Your entries are kept. Try again.',
    employeesNegative: 'Employees can’t be negative.',
    revenueNegative: 'Annual revenue can’t be negative.',
};

export const CREATE_BUTTON = 'Create account';
