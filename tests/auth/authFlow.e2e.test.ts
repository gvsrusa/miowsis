import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const TEST_USER = {
  email: 'test@miowsis.com',
  password: 'TestPassword123!',
  firstName: 'John',
  lastName: 'Doe'
};

const ADMIN_USER = {
  email: 'admin@miowsis.com',
  password: 'AdminPassword123!'
};

const INVALID_USER = {
  email: 'invalid@miowsis.com',
  password: 'WrongPassword123!'
};

test.describe('Supabase Authentication E2E Tests', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    // Clear local storage and cookies before each test
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('User Registration Flow', () => {
    test('should successfully register a new user', async () => {
      await page.goto('/register');

      // Fill registration form
      await page.fill('[data-testid="firstName-input"]', TEST_USER.firstName);
      await page.fill('[data-testid="lastName-input"]', TEST_USER.lastName);
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.fill('[data-testid="confirmPassword-input"]', TEST_USER.password);

      // Submit form
      await page.click('[data-testid="register-submit"]');

      // Should show loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

      // Should redirect to email verification page or dashboard
      await expect(page).toHaveURL(/\/(verify-email|dashboard)/);

      // Check for success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should show error for invalid email format', async () => {
      await page.goto('/register');

      await page.fill('[data-testid="firstName-input"]', TEST_USER.firstName);
      await page.fill('[data-testid="lastName-input"]', TEST_USER.lastName);
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.fill('[data-testid="confirmPassword-input"]', TEST_USER.password);

      await page.click('[data-testid="register-submit"]');

      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
    });

    test('should show error for weak password', async () => {
      await page.goto('/register');

      await page.fill('[data-testid="firstName-input"]', TEST_USER.firstName);
      await page.fill('[data-testid="lastName-input"]', TEST_USER.lastName);
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', '123');
      await page.fill('[data-testid="confirmPassword-input"]', '123');

      await page.click('[data-testid="register-submit"]');

      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toContainText('Password does not meet requirements');
    });

    test('should show error for password mismatch', async () => {
      await page.goto('/register');

      await page.fill('[data-testid="firstName-input"]', TEST_USER.firstName);
      await page.fill('[data-testid="lastName-input"]', TEST_USER.lastName);
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.fill('[data-testid="confirmPassword-input"]', 'DifferentPassword123!');

      await page.click('[data-testid="register-submit"]');

      await expect(page.locator('[data-testid="confirmPassword-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirmPassword-error"]')).toContainText('Passwords do not match');
    });

    test('should show error for duplicate email', async () => {
      await page.goto('/register');

      await page.fill('[data-testid="firstName-input"]', TEST_USER.firstName);
      await page.fill('[data-testid="lastName-input"]', TEST_USER.lastName);
      await page.fill('[data-testid="email-input"]', 'existing@miowsis.com');
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.fill('[data-testid="confirmPassword-input"]', TEST_USER.password);

      await page.click('[data-testid="register-submit"]');

      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Email already registered');
    });
  });

  test.describe('User Login Flow', () => {
    test('should successfully login with valid credentials', async () => {
      await page.goto('/login');

      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);

      await page.click('[data-testid="login-submit"]');

      // Should show loading state
      await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();

      // Should redirect to dashboard or onboarding
      await expect(page).toHaveURL(/\/(dashboard|onboarding)/);

      // Check for user menu or profile indicator
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async () => {
      await page.goto('/login');

      await page.fill('[data-testid="email-input"]', INVALID_USER.email);
      await page.fill('[data-testid="password-input"]', INVALID_USER.password);

      await page.click('[data-testid="login-submit"]');

      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid login credentials');
    });

    test('should handle empty form submission', async () => {
      await page.goto('/login');

      await page.click('[data-testid="login-submit"]');

      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('should remember user session after page reload', async () => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-submit"]');

      await expect(page).toHaveURL(/\/(dashboard|onboarding)/);

      // Reload page
      await page.reload();

      // Should still be authenticated
      await expect(page).toHaveURL(/\/(dashboard|onboarding)/);
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });
  });

  test.describe('Logout Flow', () => {
    test.beforeEach(async () => {
      // Login before each logout test
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-submit"]');
      await expect(page).toHaveURL(/\/(dashboard|onboarding)/);
    });

    test('should successfully logout user', async () => {
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Should redirect to home page
      await expect(page).toHaveURL('/');

      // User menu should not be visible
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();

      // Should show login/register buttons
      await expect(page.locator('[data-testid="login-link"]')).toBeVisible();
      await expect(page.locator('[data-testid="register-link"]')).toBeVisible();
    });

    test('should clear session data on logout', async () => {
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Check that tokens are removed from localStorage
      const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
      const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));

      expect(accessToken).toBeNull();
      expect(refreshToken).toBeNull();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async () => {
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should redirect to requested page after login', async () => {
      // Try to access protected route
      await page.goto('/portfolio');
      await expect(page).toHaveURL('/login');

      // Login
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-submit"]');

      // Should redirect back to originally requested page
      await expect(page).toHaveURL('/portfolio');
    });

    test('should allow authenticated users to access protected routes', async () => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-submit"]');

      // Navigate to protected routes
      const protectedRoutes = ['/dashboard', '/portfolio', '/transactions', '/settings'];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(route);
        await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      }
    });

    test('should redirect to onboarding for incomplete users', async () => {
      // Simulate user with incomplete onboarding
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', 'incomplete@miowsis.com');
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-submit"]');

      // Should redirect to onboarding
      await expect(page).toHaveURL('/onboarding');

      // Try to access other protected routes
      await page.goto('/dashboard');
      await expect(page).toHaveURL('/onboarding');
    });
  });

  test.describe('Password Reset Flow', () => {
    test('should send password reset email', async () => {
      await page.goto('/login');
      await page.click('[data-testid="forgot-password-link"]');

      await expect(page).toHaveURL('/forgot-password');

      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.click('[data-testid="reset-password-submit"]');

      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Reset email sent');
    });

    test('should show error for non-existent email', async () => {
      await page.goto('/forgot-password');

      await page.fill('[data-testid="email-input"]', 'nonexistent@miowsis.com');
      await page.click('[data-testid="reset-password-submit"]');

      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Email not found');
    });
  });

  test.describe('Session Management', () => {
    test('should handle token expiration gracefully', async () => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-submit"]');

      await expect(page).toHaveURL(/\/(dashboard|onboarding)/);

      // Simulate token expiration by clearing tokens
      await page.evaluate(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });

      // Navigate to protected route
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should refresh token automatically', async () => {
      // This test would require setting up a token that's about to expire
      // Implementation depends on how token refresh is configured
      
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-submit"]');

      await expect(page).toHaveURL(/\/(dashboard|onboarding)/);

      // Wait for potential token refresh (this would need to be adjusted based on actual refresh timing)
      await page.waitForTimeout(2000);

      // User should still be authenticated
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });
  });

  test.describe('Concurrent Sessions', () => {
    test('should handle multiple browser sessions', async () => {
      // Create second browser context
      const context2 = await page.context().browser()!.newContext();
      const page2 = await context2.newPage();

      try {
        // Login in first session
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', TEST_USER.email);
        await page.fill('[data-testid="password-input"]', TEST_USER.password);
        await page.click('[data-testid="login-submit"]');
        await expect(page).toHaveURL(/\/(dashboard|onboarding)/);

        // Login in second session
        await page2.goto('/login');
        await page2.fill('[data-testid="email-input"]', TEST_USER.email);
        await page2.fill('[data-testid="password-input"]', TEST_USER.password);
        await page2.click('[data-testid="login-submit"]');
        await expect(page2).toHaveURL(/\/(dashboard|onboarding)/);

        // Both sessions should be valid
        await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
        await expect(page2.locator('[data-testid="user-menu"]')).toBeVisible();

        // Logout from first session
        await page.click('[data-testid="user-menu"]');
        await page.click('[data-testid="logout-button"]');

        // Second session should still be valid
        await expect(page2.locator('[data-testid="user-menu"]')).toBeVisible();

      } finally {
        await context2.close();
      }
    });
  });

  test.describe('Security Tests', () => {
    test('should not expose sensitive data in DOM', async () => {
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-submit"]');

      await expect(page).toHaveURL(/\/(dashboard|onboarding)/);

      // Check that password is not visible in DOM
      const domContent = await page.content();
      expect(domContent).not.toContain(TEST_USER.password);

      // Check that tokens are not exposed as data attributes
      const tokenAttributes = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-token], [data-access-token], [data-refresh-token]');
        return elements.length;
      });
      expect(tokenAttributes).toBe(0);
    });

    test('should handle XSS attempts in login form', async () => {
      await page.goto('/login');

      const xssPayload = '<script>alert("xss")</script>';
      
      await page.fill('[data-testid="email-input"]', xssPayload);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-submit"]');

      // Should show validation error, not execute script
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      
      // Check that no alert was triggered
      const alerts = page.locator('text=xss');
      await expect(alerts).toHaveCount(0);
    });

    test('should prevent CSRF attacks', async () => {
      // This would require setting up CSRF token validation
      // Implementation depends on how CSRF protection is configured
      
      await page.goto('/login');
      
      // Check that CSRF token is present in forms
      const csrfToken = await page.getAttribute('form', 'data-csrf-token');
      expect(csrfToken).toBeTruthy();
    });
  });

  test.describe('Performance Tests', () => {
    test('should load authentication pages quickly', async () => {
      const startTime = Date.now();
      
      await page.goto('/login');
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle login requests within acceptable time', async () => {
      await page.goto('/login');
      
      const startTime = Date.now();
      
      await page.fill('[data-testid="email-input"]', TEST_USER.email);
      await page.fill('[data-testid="password-input"]', TEST_USER.password);
      await page.click('[data-testid="login-submit"]');
      
      await expect(page).toHaveURL(/\/(dashboard|onboarding)/);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should be keyboard navigable', async () => {
      await page.goto('/login');
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="login-submit"]')).toBeFocused();
    });

    test('should have proper ARIA labels', async () => {
      await page.goto('/login');
      
      const emailInput = page.locator('[data-testid="email-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      
      await expect(emailInput).toHaveAttribute('aria-label');
      await expect(passwordInput).toHaveAttribute('aria-label');
    });
  });
});