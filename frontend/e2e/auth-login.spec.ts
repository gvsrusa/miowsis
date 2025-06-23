import { test, expect, TEST_USERS, TEST_URLS } from './fixtures/auth-fixtures';

test.describe('Authentication - Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URLS.login);
  });

  test('should display login form', async ({ authPage }) => {
    await authPage.expectToBeOnLoginPage();
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.loginButton).toBeVisible();
  });

  test('should login with valid credentials', async ({ authPage, dashboardPage }) => {
    // Mock Supabase auth for testing
    await authPage.page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'mock-user-id',
            email: TEST_USERS.valid.email,
            user_metadata: {
              first_name: TEST_USERS.valid.firstName,
              last_name: TEST_USERS.valid.lastName
            }
          }
        })
      });
    });

    await authPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);
    await authPage.waitForLoadingToComplete();
    
    // Should redirect to dashboard
    await dashboardPage.expectToBeOnDashboard();
  });

  test('should show error for invalid credentials', async ({ authPage }) => {
    // Mock failed auth response
    await authPage.page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials'
        })
      });
    });

    await authPage.login('invalid@email.com', 'wrongpassword');
    await authPage.expectErrorMessage('Invalid login credentials');
  });

  test('should validate email format', async ({ authPage }) => {
    await authPage.emailInput.fill('invalid-email');
    await authPage.passwordInput.fill('password123');
    await authPage.loginButton.click();
    
    await authPage.expectFormValidation('[data-testid="email-input"]', 'Please enter a valid email');
  });

  test('should require password', async ({ authPage }) => {
    await authPage.emailInput.fill(TEST_USERS.valid.email);
    await authPage.loginButton.click();
    
    await authPage.expectFormValidation('[data-testid="password-input"]', 'Password is required');
  });

  test('should disable login button while loading', async ({ authPage }) => {
    // Mock slow response
    await authPage.page.route('**/auth/v1/token**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: 'mock-token' })
      });
    });

    await authPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);
    await authPage.expectLoginButtonDisabled();
  });

  test('should navigate to register page', async ({ authPage, page }) => {
    const registerLink = page.locator('[data-testid="register-link"]');
    await registerLink.click();
    
    await expect(page).toHaveURL(new RegExp(TEST_URLS.register));
  });

  test('should navigate to forgot password page', async ({ authPage }) => {
    await authPage.clickForgotPassword();
    await authPage.expectToBeOnForgotPasswordPage();
  });

  test('should support Google login', async ({ authPage }) => {
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
    
    // Should redirect to Google OAuth (we can't test the actual OAuth flow in E2E)
    await expect(authPage.page).toHaveURL(/auth\/callback/);
  });

  test('should handle network errors gracefully', async ({ authPage }) => {
    // Mock network error
    await authPage.page.route('**/auth/v1/token**', async route => {
      await route.abort('connectionfailed');
    });

    await authPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);
    await authPage.expectErrorMessage('Network error. Please try again.');
  });

  test('should clear errors when user starts typing', async ({ authPage }) => {
    // First trigger an error
    await authPage.page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid credentials'
        })
      });
    });

    await authPage.login('wrong@email.com', 'wrongpassword');
    await authPage.expectErrorMessage('Invalid credentials');
    
    // Then start typing to clear error
    await authPage.emailInput.fill('new@email.com');
    await expect(authPage.errorMessage).not.toBeVisible();
  });
});
