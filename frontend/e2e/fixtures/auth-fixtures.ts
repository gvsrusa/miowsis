import { test as base, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth-page';
import { DashboardPage } from '../pages/dashboard-page';

type AuthFixtures = {
  authPage: AuthPage;
  dashboardPage: DashboardPage;
};

export const test = base.extend<AuthFixtures>({
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
});

export { expect };

// Test data
export const TEST_USERS = {
  valid: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890'
  },
  invalid: {
    email: 'invalid-email',
    password: '123',
    firstName: '',
    lastName: ''
  },
  existing: {
    email: 'existing@example.com',
    password: 'ExistingPassword123!'
  }
};

export const TEST_URLS = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password'
};

export const SELECTORS = {
  // Login form
  loginForm: '[data-testid="login-form"]',
  emailInput: '[data-testid="email-input"]',
  passwordInput: '[data-testid="password-input"]',
  loginButton: '[data-testid="login-button"]',
  
  // Register form
  registerForm: '[data-testid="register-form"]',
  firstNameInput: '[data-testid="first-name-input"]',
  lastNameInput: '[data-testid="last-name-input"]',
  phoneInput: '[data-testid="phone-input"]',
  registerButton: '[data-testid="register-button"]',
  
  // Common elements
  errorMessage: '[data-testid="error-message"]',
  successMessage: '[data-testid="success-message"]',
  loadingSpinner: '[data-testid="loading-spinner"]',
  
  // Navigation
  logoutButton: '[data-testid="logout-button"]',
  userMenu: '[data-testid="user-menu"]',
  
  // Password reset
  forgotPasswordLink: '[data-testid="forgot-password-link"]',
  resetPasswordForm: '[data-testid="reset-password-form"]',
  newPasswordInput: '[data-testid="new-password-input"]',
  confirmPasswordInput: '[data-testid="confirm-password-input"]',
  
  // Social auth
  googleLoginButton: '[data-testid="google-login-button"]',
  
  // Dashboard elements
  dashboardTitle: '[data-testid="dashboard-title"]',
  welcomeMessage: '[data-testid="welcome-message"]'
};
