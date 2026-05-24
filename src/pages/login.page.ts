import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../core/BasePage';

/**
 * LoginPage - Page Object for the Login module.
 *
 * Extends BasePage (inherits navigation, helpers, logger, env).
 *
 * OOP Principles:
 *  - Inheritance   : extends BasePage for shared infrastructure
 *  - Encapsulation : all locators are private; only actions are public
 *  - Polymorphism  : implements abstract waitForPageLoad() from BasePage
 *
 * URL: https://automationteststore.com/index.php?rt=account/login
 */
export class LoginPage extends BasePage {

  // --- Page URL --------------------------------------------------------------
  private static readonly PAGE_PATH = 'index.php?rt=account/login';

  constructor(page: Page) {
    super(page);
  }

  // --- Private Locators ------------------------------------------------------

  private get usernameInput(): Locator {
    return this.page.locator('#loginFrm_loginname');
  }

  private get passwordInput(): Locator {
    return this.page.locator('#loginFrm_password');
  }

  private get loginButton(): Locator {
    return this.page.locator("//button[@title='Login']");
  }

  private get forgotPasswordLink(): Locator {
    return this.page.getByRole('link', { name: 'Forgot your password?' });
  }

  private get createAccountButton(): Locator {
    return this.page.getByRole('link', { name: 'Continue' });
  }

  private get loginErrorAlert(): Locator {
    return this.page.locator('.alert-danger');
  }

  /**
   * Post-login success indicator:
   * After login, top nav shows "Welcome back <username>" inside .menu_text
   * URL redirects to: /index.php?rt=account/account
   */
  private get welcomeMessage(): Locator {
    return this.page.locator('#customer_menu_top .menu_text');
  }

  /** Logoff link - only visible after successful login */
  private get logoffLink(): Locator {
    return this.page.locator('#customer_menu_top li a[href*="logout"]');
  }

  private get pageHeading(): Locator {
    return this.page.locator('.maintext');
  }

  private get loginSection(): Locator {
    return this.page.locator('#loginFrm');
  }

  // --- Abstract Method Implementation ---------------------------------------

  async waitForPageLoad(): Promise<void> {
    this.logger.step('Waiting for Login page to load');
    await this.loginSection.waitFor({ state: 'visible', timeout: 15000 });
    this.logger.info('[PASS]  Login page loaded');
  }

  // --- Public Navigation -----------------------------------------------------

  async goto(): Promise<void> {
    this.logger.step('Navigating to Login page');
    await this.navigateTo(LoginPage.PAGE_PATH);
    await this.waitForPageLoad();
  }

  // --- Public Actions --------------------------------------------------------

  async enterUsername(username: string): Promise<void> {
    this.logger.step(`Enter username: ${username}`);
    await this.helpers.fill(this.usernameInput, username, 'Username Input');
  }

  async enterPassword(password: string): Promise<void> {
    this.logger.step('Enter password: ****');
    await this.helpers.fill(this.passwordInput, password, 'Password Input');
  }

  async clickLoginButton(): Promise<void> {
    this.logger.step('Click Login button');
    await this.helpers.click(this.loginButton, 'Login Button');
    await this.page.waitForLoadState('networkidle');
  }

  async clickForgotPassword(): Promise<void> {
    this.logger.step('Click Forgot Password link');
    await this.helpers.click(this.forgotPasswordLink, 'Forgot Password Link');
  }

  async clickCreateAccount(): Promise<void> {
    this.logger.step('Click Create Account (Continue) button');
    await this.helpers.click(this.createAccountButton, 'Create Account Button');
  }

  async login(username: string, password: string): Promise<void> {
    this.logger.step(`Performing login for user: ${username}`);
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
  }

  async loginWithDefaultCredentials(): Promise<void> {
    this.logger.step('Performing login with default .env credentials');
    await this.login(this.env.username, this.env.password);
  }

  // --- Public Assertions -----------------------------------------------------

  /**
   * Asserts successful login:
   * - URL contains account/account
   * - Welcome message is visible in top nav
   */
  async assertLoginSuccess(): Promise<void> {
    this.logger.step('Assert login was successful');
    await expect(this.page).toHaveURL(/account\/account/, { timeout: 15000 });
    await expect(this.welcomeMessage).toBeVisible({ timeout: 10000 });
    this.logger.info('[PASS]  Login success assertion passed');
  }

  async assertLoginError(expectedMessage?: string): Promise<void> {
    this.logger.step('Assert login error is displayed');
    await expect(this.loginErrorAlert).toBeVisible({ timeout: 10000 });
    if (expectedMessage) {
      await expect(this.loginErrorAlert).toContainText(expectedMessage);
    }
    this.logger.info('[PASS]  Login error assertion passed');
  }

  async assertOnLoginPage(): Promise<void> {
    this.logger.step('Assert currently on Login page');
    await expect(this.loginSection).toBeVisible({ timeout: 10000 });
    this.logger.info('[PASS]  Login page assertion passed');
  }

  async assertLogoffVisible(): Promise<void> {
    this.logger.step('Assert Logoff link is visible');
    await expect(this.logoffLink).toBeVisible({ timeout: 10000 });
    this.logger.info('[PASS]  Logoff link assertion passed');
  }

  // --- Public Getters --------------------------------------------------------

  async getErrorMessage(): Promise<string> {
    return this.helpers.getText(this.loginErrorAlert);
  }

  async getWelcomeMessage(): Promise<string> {
    return this.helpers.getText(this.welcomeMessage);
  }

  async getHeadingText(): Promise<string> {
    return this.helpers.getText(this.pageHeading);
  }
}
