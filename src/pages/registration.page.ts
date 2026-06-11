import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '@core/BasePage';
import { Helpers } from '@utils/Helpers';

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  address: string;
  city: string;
  country: string;
  region: string;
  postcode: string;
  loginName: string;
  password: string;
}

export class RegistrationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private get registrationForm(): Locator {
    return this.page.locator('#AccountFrm');
  }

  private get successHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Your Account Has Been Created!' });
  }

  async waitForPageLoad(): Promise<void> {
    await this.registrationForm.waitFor({ state: 'visible', timeout: 15000 });
    this.logger.info('[PASS]  Registration page loaded');
  }

  generateRandomUser(): RegistrationData {
    const uniqueId = `${Date.now().toString(36)}${Helpers.randomString(5)}`;

    return {
      firstName: `Auto${Helpers.randomString(5)}`,
      lastName: `User${Helpers.randomString(5)}`,
      email: `auto_${uniqueId}@testmail.com`,
      telephone: '9876543210',
      address: '123 Automation Street',
      city: 'San Francisco',
      country: 'United States',
      region: 'California',
      postcode: '94105',
      loginName: `auto${uniqueId}`,
      password: `Pw!${uniqueId}`,
    };
  }

  async register(user: RegistrationData): Promise<void> {
    this.logger.step(`Register new user: ${user.loginName}`);

    await this.helpers.fill(this.page.locator('#AccountFrm_firstname'), user.firstName, 'First Name');
    await this.helpers.fill(this.page.locator('#AccountFrm_lastname'), user.lastName, 'Last Name');
    await this.helpers.fill(this.page.locator('#AccountFrm_email'), user.email, 'Email');
    await this.helpers.fill(this.page.locator('#AccountFrm_telephone'), user.telephone, 'Telephone');
    await this.helpers.fill(this.page.locator('#AccountFrm_address_1'), user.address, 'Address');
    await this.helpers.fill(this.page.locator('#AccountFrm_city'), user.city, 'City');
    await this.page.locator('#AccountFrm_country_id').selectOption({ label: user.country });
    await this.page.locator('#AccountFrm_zone_id').selectOption({ label: user.region });
    await this.helpers.fill(this.page.locator('#AccountFrm_postcode'), user.postcode, 'Postcode');
    await this.helpers.fill(this.page.locator('#AccountFrm_loginname'), user.loginName, 'Login Name');

    await this.page.locator('#AccountFrm_password').fill(user.password);
    await this.page.locator('#AccountFrm_confirm').fill(user.password);
    await this.page.locator('#AccountFrm_agree').check();
    await this.helpers.click(this.page.getByRole('button', { name: /Continue/ }), 'Continue Registration');
  }

  async assertRegistrationSuccess(firstName: string): Promise<void> {
    await expect(this.page).toHaveURL(/account\/success/, { timeout: 15000 });
    await expect(this.successHeading).toBeVisible();
    await expect(this.page.locator('#customer_menu_top .menu_text')).toContainText(firstName);
    this.logger.info('[PASS]  User registration completed successfully');
  }
}
