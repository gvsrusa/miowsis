import { test, expect, TEST_USERS, TEST_URLS } from './fixtures/auth-fixtures';

test.describe('Authentication - Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URLS.register);
  });

  test('should display registration form', async ({ authPage }) => {
    await authPage.expectToBeOnRegisterPage();
    await expect(authPage.firstNameInput).toBeVisible();
    await expect(authPage.lastNameInput).toBeVisible();
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.registerButton).toBeVisible();
  });

  test('should register with valid data', async ({ authPage, dashboardPage }) => {
    // Mock successful registration
    await authPage.page.route('**/auth/v1/signup**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'new-user-id',
            email: TEST_USERS.valid.email,
            email_confirmed_at: null,
            user_metadata: {
              first_name: TEST_USERS.valid.firstName,
              last_name: TEST_USERS.valid.lastName
            }
          },
          session: null // Email confirmation required
        })
      });
    });

    await authPage.register(TEST_USERS.valid);
    await authPage.waitForLoadingToComplete();
    
    // Should show email confirmation message
    await authPage.expectSuccessMessage('Please check your email to confirm your account');
  });

  test('should validate required fields', async ({ authPage }) => {
    await authPage.registerButton.click();
    
    await authPage.expectFormValidation('[data-testid="first-name-input"]', 'First name is required');
    await authPage.expectFormValidation('[data-testid="last-name-input"]', 'Last name is required');
    await authPage.expectFormValidation('[data-testid="email-input"]', 'Email is required');
    await authPage.expectFormValidation('[data-testid="password-input"]', 'Password is required');
  });

  test('should validate email format', async ({ authPage }) => {
    await authPage.firstNameInput.fill(TEST_USERS.valid.firstName);
    await authPage.lastNameInput.fill(TEST_USERS.valid.lastName);
    await authPage.emailInput.fill('invalid-email');
    await authPage.passwordInput.fill(TEST_USERS.valid.password);
    await authPage.registerButton.click();
    
    await authPage.expectFormValidation('[data-testid="email-input"]', 'Please enter a valid email');
  });

  test('should validate password strength', async ({ authPage }) => {
    await authPage.firstNameInput.fill(TEST_USERS.valid.firstName);
    await authPage.lastNameInput.fill(TEST_USERS.valid.lastName);
    await authPage.emailInput.fill(TEST_USERS.valid.email);
    await authPage.passwordInput.fill('weak');
    await authPage.registerButton.click();
    
    await authPage.expectFormValidation('[data-testid="password-input"]', 'Password must be at least 8 characters');
  });

  test('should show error for existing email', async ({ authPage }) => {
    // Mock email already exists error
    await authPage.page.route('**/auth/v1/signup**', async route => {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'signup_disabled',
          error_description: 'User already registered'
        })
      });
    });

    await authPage.register({
      ...TEST_USERS.valid,
      email: TEST_USERS.existing.email
    });
    
    await authPage.expectErrorMessage('User already registered');
  });

  test('should validate phone number format', async ({ authPage }) => {
    await authPage.firstNameInput.fill(TEST_USERS.valid.firstName);
    await authPage.lastNameInput.fill(TEST_USERS.valid.lastName);
    await authPage.emailInput.fill(TEST_USERS.valid.email);
    await authPage.passwordInput.fill(TEST_USERS.valid.password);
    await authPage.phoneInput.fill('invalid-phone');
    await authPage.registerButton.click();
    
    await authPage.expectFormValidation('[data-testid="phone-input"]', 'Please enter a valid phone number');
  });

  test('should disable register button while loading', async ({ authPage }) => {
    // Mock slow response
    await authPage.page.route('**/auth/v1/signup**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: 'mock-id' } })
      });
    });

    await authPage.register(TEST_USERS.valid);
    await authPage.expectRegisterButtonDisabled();
  });

  test('should navigate to login page', async ({ authPage, page }) => {
    const loginLink = page.locator('[data-testid="login-link"]');
    await loginLink.click();
    
    await expect(page).toHaveURL(new RegExp(TEST_URLS.login));
  });

  test('should show password strength indicator', async ({ authPage, page }) => {
    const strengthIndicator = page.locator('[data-testid="password-strength"]');
    
    // Weak password
    await authPage.passwordInput.fill('123');
    await expect(strengthIndicator).toHaveText('Weak');
    await expect(strengthIndicator).toHaveClass(/weak/);
    
    // Medium password
    await authPage.passwordInput.fill('password123');
    await expect(strengthIndicator).toHaveText('Medium');
    await expect(strengthIndicator).toHaveClass(/medium/);
    
    // Strong password
    await authPage.passwordInput.fill('StrongPassword123!');
    await expect(strengthIndicator).toHaveText('Strong');
    await expect(strengthIndicator).toHaveClass(/strong/);
  });

  test('should handle special characters in names', async ({ authPage }) => {
    // Mock successful registration
    await authPage.page.route('**/auth/v1/signup**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'new-user-id', email: 'test@example.com' }
        })
      });
    });

    await authPage.register({
      firstName: "José",
      lastName: "O'Connor-Smith",
      email: 'jose@example.com',
      password: 'StrongPassword123!'
    });
    
    await authPage.waitForLoadingToComplete();
    await authPage.expectSuccessMessage('Please check your email');
  });

  test('should support Google registration', async ({ authPage }) => {
    // Mock Google OAuth redirect
    await authPage.page.route('**/auth/v1/authorize**', async route => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('provider') === 'google') {
        await route.fulfill({
          status: 302,
          headers: {
            'Location': '/auth/callback?code=mock-auth-code'
          }
        });
      }
    });

    await authPage.loginWithGoogle();
    
    // Should redirect to Google OAuth
    await expect(authPage.page).toHaveURL(/auth\/callback/);
  });

  test('should handle network errors during registration', async ({ authPage }) => {
    // Mock network error
    await authPage.page.route('**/auth/v1/signup**', async route => {
      await route.abort('connectionfailed');
    });

    await authPage.register(TEST_USERS.valid);
    await authPage.expectErrorMessage('Network error. Please try again.');
  });
});
