import { Page, Locator, expect } from '@playwright/test';
import { SELECTORS, TEST_URLS } from '../fixtures/auth-fixtures';

export class AuthPage {
  readonly page: Page;
  
  // Login elements
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  
  // Register elements
  readonly registerForm: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly phoneInput: Locator;
  readonly registerButton: Locator;
  
  // Common elements
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly loadingSpinner: Locator;
  
  // Password reset elements
  readonly forgotPasswordLink: Locator;
  readonly resetPasswordForm: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  
  // Social auth
  readonly googleLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Initialize login elements
    this.loginForm = page.locator(SELECTORS.loginForm);
    this.emailInput = page.locator(SELECTORS.emailInput);
    this.passwordInput = page.locator(SELECTORS.passwordInput);
    this.loginButton = page.locator(SELECTORS.loginButton);
    
    // Initialize register elements
    this.registerForm = page.locator(SELECTORS.registerForm);
    this.firstNameInput = page.locator(SELECTORS.firstNameInput);
    this.lastNameInput = page.locator(SELECTORS.lastNameInput);
    this.phoneInput = page.locator(SELECTORS.phoneInput);
    this.registerButton = page.locator(SELECTORS.registerButton);
    
    // Initialize common elements
    this.errorMessage = page.locator(SELECTORS.errorMessage);
    this.successMessage = page.locator(SELECTORS.successMessage);
    this.loadingSpinner = page.locator(SELECTORS.loadingSpinner);
    
    // Initialize password reset elements
    this.forgotPasswordLink = page.locator(SELECTORS.forgotPasswordLink);
    this.resetPasswordForm = page.locator(SELECTORS.resetPasswordForm);
    this.newPasswordInput = page.locator(SELECTORS.newPasswordInput);
    this.confirmPasswordInput = page.locator(SELECTORS.confirmPasswordInput);
    
    // Initialize social auth
    this.googleLoginButton = page.locator(SELECTORS.googleLoginButton);
  }

  async goto(url: string = TEST_URLS.login) {
    await this.page.goto(url);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }) {
    await this.firstNameInput.fill(userData.firstName);
    await this.lastNameInput.fill(userData.lastName);
    await this.emailInput.fill(userData.email);
    await this.passwordInput.fill(userData.password);
    
    if (userData.phoneNumber) {
      await this.phoneInput.fill(userData.phoneNumber);
    }
    
    await this.registerButton.click();
  }

  async waitForLoadingToComplete() {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  async expectSuccessMessage(message: string) {
    await expect(this.successMessage).toBeVisible();
    await expect(this.successMessage).toContainText(message);
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async resetPassword(email: string) {
    await this.goto(TEST_URLS.forgotPassword);
    await this.emailInput.fill(email);
    await this.page.locator('[data-testid="reset-password-button"]').click();
  }

  async setNewPassword(newPassword: string, confirmPassword: string) {
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.page.locator('[data-testid="update-password-button"]').click();
  }

  async loginWithGoogle() {
    await this.googleLoginButton.click();
  }

  async expectToBeOnLoginPage() {
    await expect(this.page).toHaveURL(new RegExp(TEST_URLS.login));
    await expect(this.loginForm).toBeVisible();
  }

  async expectToBeOnRegisterPage() {
    await expect(this.page).toHaveURL(new RegExp(TEST_URLS.register));
    await expect(this.registerForm).toBeVisible();
  }

  async expectToBeOnForgotPasswordPage() {
    await expect(this.page).toHaveURL(new RegExp(TEST_URLS.forgotPassword));
  }

  async expectFormValidation(fieldSelector: string, errorMessage: string) {
    const field = this.page.locator(fieldSelector);
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    
    const fieldError = this.page.locator(`${fieldSelector}-error`);
    await expect(fieldError).toContainText(errorMessage);
  }

  async expectLoginButtonDisabled() {
    await expect(this.loginButton).toBeDisabled();
  }

  async expectRegisterButtonDisabled() {
    await expect(this.registerButton).toBeDisabled();
  }
}
