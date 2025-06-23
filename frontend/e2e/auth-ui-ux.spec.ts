import { test, expect, TEST_USERS } from './fixtures/auth-fixtures';

test.describe('Authentication - UI/UX Experience', () => {
  test.describe('Form Interactions', () => {
    test('should handle keyboard navigation', async ({ page, authPage }) => {
      await authPage.goto();
      
      // Tab through form elements
      await page.keyboard.press('Tab'); // Email field
      await expect(authPage.emailInput).toBeFocused();
      
      await page.keyboard.press('Tab'); // Password field
      await expect(authPage.passwordInput).toBeFocused();
      
      await page.keyboard.press('Tab'); // Login button
      await expect(authPage.loginButton).toBeFocused();
      
      // Enter should submit form
      await authPage.emailInput.fill(TEST_USERS.valid.email);
      await authPage.passwordInput.fill(TEST_USERS.valid.password);
      await page.keyboard.press('Enter');
      
      // Should attempt login
      await expect(authPage.loginButton).toBeDisabled();
    });

    test('should show password visibility toggle', async ({ page, authPage }) => {
      await authPage.goto();
      
      const passwordToggle = page.locator('[data-testid="password-toggle"]');
      
      // Initially password should be hidden
      await expect(authPage.passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle to show password
      await passwordToggle.click();
      await expect(authPage.passwordInput).toHaveAttribute('type', 'text');
      
      // Click again to hide
      await passwordToggle.click();
      await expect(authPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('should handle form autofill', async ({ page, authPage }) => {
      await authPage.goto();
      
      // Simulate browser autofill
      await authPage.emailInput.fill(TEST_USERS.valid.email);
      await authPage.passwordInput.fill(TEST_USERS.valid.password);
      
      // Form should be valid and submit button enabled
      await expect(authPage.loginButton).toBeEnabled();
    });

    test('should clear form errors on input change', async ({ page, authPage }) => {
      await authPage.goto();
      
      // Trigger validation error
      await authPage.emailInput.fill('invalid-email');
      await authPage.loginButton.click();
      
      await authPage.expectFormValidation('[data-testid="email-input"]', 'Please enter a valid email');
      
      // Start typing valid email
      await authPage.emailInput.fill('valid@example.com');
      
      // Error should clear
      const emailError = page.locator('[data-testid="email-input-error"]');
      await expect(emailError).not.toBeVisible();
    });

    test('should handle copy/paste in password field', async ({ page, authPage }) => {
      await authPage.goto();
      
      // Test pasting password
      await authPage.passwordInput.focus();
      await page.evaluate(() => {
        navigator.clipboard.writeText('PastedPassword123!');
      });
      
      await page.keyboard.press('Control+v');
      
      const passwordValue = await authPage.passwordInput.inputValue();
      expect(passwordValue).toBe('PastedPassword123!');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page, authPage }) => {
      await authPage.goto();
      
      // Check form labels
      await expect(authPage.emailInput).toHaveAttribute('aria-label', 'Email address');
      await expect(authPage.passwordInput).toHaveAttribute('aria-label', 'Password');
      
      // Check error announcements
      await authPage.loginButton.click();
      
      const emailError = page.locator('[data-testid="email-input-error"]');
      await expect(emailError).toHaveAttribute('role', 'alert');
    });

    test('should support screen readers', async ({ page, authPage }) => {
      await authPage.goto();
      
      // Check form structure
      const form = authPage.loginForm;
      await expect(form).toHaveAttribute('role', 'form');
      await expect(form).toHaveAttribute('aria-label', 'Login form');
      
      // Check field associations
      const emailLabel = page.locator('label[for="email"]');
      await expect(emailLabel).toBeVisible();
      await expect(authPage.emailInput).toHaveAttribute('id', 'email');
    });

    test('should handle high contrast mode', async ({ page, authPage }) => {
      await authPage.goto();
      
      // Simulate high contrast mode
      await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
      
      // Elements should still be visible and functional
      await expect(authPage.loginButton).toBeVisible();
      await expect(authPage.emailInput).toBeVisible();
      await expect(authPage.passwordInput).toBeVisible();
    });

    test('should support reduced motion', async ({ page, authPage }) => {
      await authPage.goto();
      
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      // Animations should be minimal or disabled
      const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
      
      // Trigger loading state
      await page.route('**/auth/v1/token**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({ status: 200, body: '{}' });
      });
      
      await authPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);
      
      // Spinner should be visible but not animated
      await expect(loadingSpinner).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page, authPage }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await authPage.goto();
      
      // Form should be visible and usable
      await expect(authPage.loginForm).toBeVisible();
      await expect(authPage.emailInput).toBeVisible();
      await expect(authPage.passwordInput).toBeVisible();
      await expect(authPage.loginButton).toBeVisible();
      
      // Test form interaction on mobile
      await authPage.emailInput.fill(TEST_USERS.valid.email);
      await authPage.passwordInput.fill(TEST_USERS.valid.password);
      
      // Button should be easily tappable
      const buttonBox = await authPage.loginButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThan(44); // iOS minimum tap target
    });

    test('should work on tablet devices', async ({ page, authPage }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await authPage.goto();
      
      // Form should be properly sized
      await expect(authPage.loginForm).toBeVisible();
      
      // Check form layout
      const formBox = await authPage.loginForm.boundingBox();
      expect(formBox?.width).toBeLessThan(600); // Should not be too wide on tablet
    });

    test('should work on desktop', async ({ page, authPage }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await authPage.goto();
      
      // Form should be centered and appropriately sized
      await expect(authPage.loginForm).toBeVisible();
      
      const formBox = await authPage.loginForm.boundingBox();
      expect(formBox?.width).toBeLessThan(500); // Should not be too wide
    });

    test('should handle orientation changes', async ({ page, authPage }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await authPage.goto();
      
      await expect(authPage.loginForm).toBeVisible();
      
      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      
      // Form should still be visible and usable
      await expect(authPage.loginForm).toBeVisible();
      await expect(authPage.emailInput).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load quickly', async ({ page, authPage }) => {
      const startTime = Date.now();
      await authPage.goto();
      
      // Page should load within reasonable time
      await expect(authPage.loginForm).toBeVisible();
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle slow network conditions', async ({ page, authPage }) => {
      // Simulate slow 3G connection
      await page.context().setExtraHTTPHeaders({
        'Connection': 'keep-alive'
      });
      
      // Throttle network (if supported)
      try {
        await page.context().setOffline(false);
      } catch (e) {
        // Network throttling may not be available in all environments
      }
      
      await authPage.goto();
      
      // Form should still be functional
      await expect(authPage.loginForm).toBeVisible({ timeout: 10000 });
    });

    test('should handle concurrent form submissions', async ({ page, authPage }) => {
      await authPage.goto();
      
      let requestCount = 0;
      await page.route('**/auth/v1/token**', async route => {
        requestCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ access_token: 'token' })
        });
      });
      
      // Fill form
      await authPage.emailInput.fill(TEST_USERS.valid.email);
      await authPage.passwordInput.fill(TEST_USERS.valid.password);
      
      // Submit multiple times quickly
      await authPage.loginButton.click();
      await authPage.loginButton.click();
      await authPage.loginButton.click();
      
      // Should only send one request
      await page.waitForTimeout(2000);
      expect(requestCount).toBe(1);
    });
  });

  test.describe('Error Display', () => {
    test('should show user-friendly error messages', async ({ page, authPage }) => {
      await authPage.goto();
      
      // Test various error scenarios
      const errorScenarios = [
        {
          mockError: 'invalid_grant',
          expectedMessage: 'Invalid email or password'
        },
        {
          mockError: 'too_many_attempts',
          expectedMessage: 'Too many failed attempts. Please try again later.'
        },
        {
          mockError: 'email_not_confirmed',
          expectedMessage: 'Please verify your email address before signing in'
        }
      ];
      
      for (const scenario of errorScenarios) {
        await page.route('**/auth/v1/token**', async route => {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: scenario.mockError,
              error_description: scenario.expectedMessage
            })
          });
        });
        
        await authPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);
        await authPage.expectErrorMessage(scenario.expectedMessage);
        
        // Clear error for next test
        await authPage.emailInput.fill('');
        await authPage.emailInput.fill(TEST_USERS.valid.email);
      }
    });

    test('should auto-dismiss success messages', async ({ page, authPage }) => {
      await authPage.goto('/forgot-password');
      
      // Mock successful password reset
      await page.route('**/auth/v1/recover**', async route => {
        await route.fulfill({ status: 200, body: '{}' });
      });
      
      await authPage.resetPassword(TEST_USERS.valid.email);
      await authPage.expectSuccessMessage('Password reset email sent');
      
      // Success message should auto-dismiss after a delay
      await expect(authPage.successMessage).not.toBeVisible({ timeout: 6000 });
    });

    test('should persist error messages until user action', async ({ page, authPage }) => {
      await authPage.goto();
      
      // Show error
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'invalid_grant' })
        });
      });
      
      await authPage.login('wrong@email.com', 'wrongpassword');
      await authPage.expectErrorMessage('Invalid email or password');
      
      // Error should persist
      await page.waitForTimeout(3000);
      await expect(authPage.errorMessage).toBeVisible();
      
      // Should clear when user starts typing
      await authPage.emailInput.fill('new@email.com');
      await expect(authPage.errorMessage).not.toBeVisible();
    });
  });

  test.describe('Visual Feedback', () => {
    test('should show loading states', async ({ page, authPage }) => {
      await authPage.goto();
      
      // Mock slow response
      await page.route('**/auth/v1/token**', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({ status: 200, body: '{}' });
      });
      
      await authPage.emailInput.fill(TEST_USERS.valid.email);
      await authPage.passwordInput.fill(TEST_USERS.valid.password);
      await authPage.loginButton.click();
      
      // Should show loading state
      await expect(authPage.loadingSpinner).toBeVisible();
      await expect(authPage.loginButton).toBeDisabled();
      await expect(authPage.loginButton).toContainText('Signing in...');
    });

    test('should provide focus indicators', async ({ page, authPage }) => {
      await authPage.goto();
      
      // Tab to email input
      await page.keyboard.press('Tab');
      
      // Should have visible focus indicator
      await expect(authPage.emailInput).toBeFocused();
      await expect(authPage.emailInput).toHaveCSS('outline-width', /.+/);
    });

    test('should show field validation states', async ({ page, authPage }) => {
      await authPage.goto();
      
      // Invalid email should show error state
      await authPage.emailInput.fill('invalid-email');
      await authPage.passwordInput.focus(); // Trigger validation
      
      await expect(authPage.emailInput).toHaveClass(/error|invalid/);
      
      // Valid email should show success state
      await authPage.emailInput.fill('valid@example.com');
      await authPage.passwordInput.focus();
      
      await expect(authPage.emailInput).toHaveClass(/success|valid/);
    });
  });
});
