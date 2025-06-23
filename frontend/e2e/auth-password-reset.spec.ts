import { test, expect, TEST_USERS, TEST_URLS } from './fixtures/auth-fixtures';

test.describe('Authentication - Password Reset Flow', () => {
  test.describe('Forgot Password', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(TEST_URLS.forgotPassword);
    });

    test('should display forgot password form', async ({ authPage, page }) => {
      await authPage.expectToBeOnForgotPasswordPage();
      await expect(authPage.emailInput).toBeVisible();
      
      const resetButton = page.locator('[data-testid="reset-password-button"]');
      await expect(resetButton).toBeVisible();
    });

    test('should send password reset email for valid email', async ({ authPage, page }) => {
      // Mock successful password reset request
      await authPage.page.route('**/auth/v1/recover**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({})
        });
      });

      await authPage.resetPassword(TEST_USERS.valid.email);
      await authPage.expectSuccessMessage('Password reset email sent. Check your inbox.');
    });

    test('should validate email format', async ({ authPage, page }) => {
      await authPage.emailInput.fill('invalid-email');
      
      const resetButton = page.locator('[data-testid="reset-password-button"]');
      await resetButton.click();
      
      await authPage.expectFormValidation('[data-testid="email-input"]', 'Please enter a valid email');
    });

    test('should require email field', async ({ authPage, page }) => {
      const resetButton = page.locator('[data-testid="reset-password-button"]');
      await resetButton.click();
      
      await authPage.expectFormValidation('[data-testid="email-input"]', 'Email is required');
    });

    test('should show error for non-existent email', async ({ authPage }) => {
      // Mock user not found error
      await authPage.page.route('**/auth/v1/recover**', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'user_not_found',
            error_description: 'User not found'
          })
        });
      });

      await authPage.resetPassword('nonexistent@example.com');
      await authPage.expectErrorMessage('User not found');
    });

    test('should navigate back to login', async ({ authPage, page }) => {
      const backToLoginLink = page.locator('[data-testid="back-to-login-link"]');
      await backToLoginLink.click();
      
      await expect(page).toHaveURL(new RegExp(TEST_URLS.login));
    });

    test('should handle rate limiting', async ({ authPage }) => {
      // Mock rate limit error
      await authPage.page.route('**/auth/v1/recover**', async route => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'rate_limit_exceeded',
            error_description: 'Too many requests. Please try again later.'
          })
        });
      });

      await authPage.resetPassword(TEST_USERS.valid.email);
      await authPage.expectErrorMessage('Too many requests. Please try again later.');
    });
  });

  test.describe('Reset Password', () => {
    test.beforeEach(async ({ page }) => {
      // Simulate arriving from email link with reset token
      await page.goto(`${TEST_URLS.resetPassword}?token=mock-reset-token&type=recovery`);
    });

    test('should display reset password form', async ({ authPage, page }) => {
      await expect(page).toHaveURL(new RegExp(TEST_URLS.resetPassword));
      await expect(authPage.newPasswordInput).toBeVisible();
      await expect(authPage.confirmPasswordInput).toBeVisible();
      
      const updateButton = page.locator('[data-testid="update-password-button"]');
      await expect(updateButton).toBeVisible();
    });

    test('should update password with valid data', async ({ authPage, page }) => {
      // Mock successful password update
      await authPage.page.route('**/auth/v1/user**', async route => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: {
                id: 'user-id',
                email: TEST_USERS.valid.email
              }
            })
          });
        }
      });

      const newPassword = 'NewStrongPassword123!';
      await authPage.setNewPassword(newPassword, newPassword);
      
      await authPage.expectSuccessMessage('Password updated successfully');
      
      // Should redirect to login after successful update
      await expect(page).toHaveURL(new RegExp(TEST_URLS.login));
    });

    test('should validate password strength', async ({ authPage, page }) => {
      await authPage.newPasswordInput.fill('weak');
      await authPage.confirmPasswordInput.fill('weak');
      
      const updateButton = page.locator('[data-testid="update-password-button"]');
      await updateButton.click();
      
      await authPage.expectFormValidation('[data-testid="new-password-input"]', 'Password must be at least 8 characters');
    });

    test('should validate password confirmation match', async ({ authPage, page }) => {
      await authPage.newPasswordInput.fill('StrongPassword123!');
      await authPage.confirmPasswordInput.fill('DifferentPassword123!');
      
      const updateButton = page.locator('[data-testid="update-password-button"]');
      await updateButton.click();
      
      await authPage.expectFormValidation('[data-testid="confirm-password-input"]', 'Passwords do not match');
    });

    test('should require both password fields', async ({ authPage, page }) => {
      const updateButton = page.locator('[data-testid="update-password-button"]');
      await updateButton.click();
      
      await authPage.expectFormValidation('[data-testid="new-password-input"]', 'New password is required');
      await authPage.expectFormValidation('[data-testid="confirm-password-input"]', 'Password confirmation is required');
    });

    test('should handle expired reset token', async ({ authPage, page }) => {
      // Mock expired token error
      await authPage.page.route('**/auth/v1/user**', async route => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'token_expired',
              error_description: 'Reset token has expired'
            })
          });
        }
      });

      const newPassword = 'NewStrongPassword123!';
      await authPage.setNewPassword(newPassword, newPassword);
      
      await authPage.expectErrorMessage('Reset token has expired');
    });

    test('should handle invalid reset token', async ({ page }) => {
      // Navigate with invalid token
      await page.goto(`${TEST_URLS.resetPassword}?token=invalid-token&type=recovery`);
      
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Invalid or expired reset link');
    });

    test('should show password strength indicator', async ({ authPage, page }) => {
      const strengthIndicator = page.locator('[data-testid="password-strength"]');
      
      // Weak password
      await authPage.newPasswordInput.fill('123');
      await expect(strengthIndicator).toHaveText('Weak');
      
      // Strong password
      await authPage.newPasswordInput.fill('VeryStrongPassword123!');
      await expect(strengthIndicator).toHaveText('Strong');
    });

    test('should toggle password visibility', async ({ authPage, page }) => {
      const toggleButton = page.locator('[data-testid="toggle-password-visibility"]');
      
      // Initially password should be hidden
      await expect(authPage.newPasswordInput).toHaveAttribute('type', 'password');
      
      // Click to show password
      await toggleButton.click();
      await expect(authPage.newPasswordInput).toHaveAttribute('type', 'text');
      
      // Click to hide password again
      await toggleButton.click();
      await expect(authPage.newPasswordInput).toHaveAttribute('type', 'password');
    });

    test('should prevent same password as current', async ({ authPage, page }) => {
      // Mock validation error for same password
      await authPage.page.route('**/auth/v1/user**', async route => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'same_password',
              error_description: 'New password must be different from current password'
            })
          });
        }
      });

      const newPassword = 'CurrentPassword123!';
      await authPage.setNewPassword(newPassword, newPassword);
      
      await authPage.expectErrorMessage('New password must be different from current password');
    });
  });
});
