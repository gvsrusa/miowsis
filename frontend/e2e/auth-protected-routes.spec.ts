import { test, expect, TEST_USERS, TEST_URLS } from './fixtures/auth-fixtures';

test.describe('Authentication - Protected Routes & Session Management', () => {
  test.describe('Protected Routes Access', () => {
    test('should redirect unauthenticated users to login', async ({ page, dashboardPage }) => {
      // Try to access protected dashboard without authentication
      await dashboardPage.goto();
      
      // Should be redirected to login
      await expect(page).toHaveURL(new RegExp(TEST_URLS.login));
    });

    test('should allow authenticated users to access protected routes', async ({ authPage, dashboardPage, page }) => {
      // Mock authentication
      await page.addInitScript(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'mock-user-id',
            email: 'test@example.com'
          }
        }));
      });

      // Mock auth state API calls
      await page.route('**/auth/v1/user**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'mock-user-id',
            email: 'test@example.com',
            user_metadata: {
              first_name: 'John',
              last_name: 'Doe'
            }
          })
        });
      });

      await dashboardPage.goto();
      await dashboardPage.expectToBeOnDashboard();
      await dashboardPage.expectProtectedContent();
    });

    test('should preserve intended destination after login', async ({ authPage, page }) => {
      // Try to access dashboard (will redirect to login)
      await page.goto(TEST_URLS.dashboard);
      await expect(page).toHaveURL(new RegExp(TEST_URLS.login));
      
      // Check that return URL is preserved
      const url = new URL(page.url());
      expect(url.searchParams.get('returnUrl')).toBe(TEST_URLS.dashboard);
      
      // Mock successful login
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-access-token',
            user: { id: 'user-id', email: TEST_USERS.valid.email }
          })
        });
      });

      await authPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);
      
      // Should redirect back to intended destination
      await expect(page).toHaveURL(new RegExp(TEST_URLS.dashboard));
    });

    test('should handle multiple protected routes', async ({ page }) => {
      const protectedRoutes = [
        TEST_URLS.dashboard,
        '/portfolio',
        '/transactions',
        '/settings'
      ];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(new RegExp(TEST_URLS.login));
      }
    });
  });

  test.describe('Session Management', () => {
    test('should maintain authentication state across page reloads', async ({ authPage, dashboardPage, page }) => {
      // Mock login
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            user: {
              id: 'user-id',
              email: TEST_USERS.valid.email,
              user_metadata: {
                first_name: TEST_USERS.valid.firstName,
                last_name: TEST_USERS.valid.lastName
              }
            }
          })
        });
      });

      // Mock session retrieval
      await page.route('**/auth/v1/user**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user-id',
            email: TEST_USERS.valid.email
          })
        });
      });

      await authPage.goto();
      await authPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);
      await dashboardPage.expectToBeOnDashboard();
      
      // Reload page
      await page.reload();
      
      // Should still be authenticated
      await dashboardPage.expectToBeOnDashboard();
      await dashboardPage.expectUserToBeLoggedIn();
    });

    test('should handle expired sessions gracefully', async ({ authPage, dashboardPage, page }) => {
      // Mock initial successful auth
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-access-token',
            user: { id: 'user-id', email: TEST_USERS.valid.email }
          })
        });
      });

      await authPage.goto();
      await authPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);
      await dashboardPage.expectToBeOnDashboard();
      
      // Mock expired session on next API call
      await page.route('**/auth/v1/user**', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'invalid_token',
            error_description: 'JWT expired'
          })
        });
      });

      // Trigger an API call that would check auth
      await page.reload();
      
      // Should redirect to login
      await expect(page).toHaveURL(new RegExp(TEST_URLS.login));
    });

    test('should refresh tokens automatically', async ({ authPage, dashboardPage, page }) => {
      let tokenRefreshCalled = false;
      
      // Mock login
      await page.route('**/auth/v1/token**', async route => {
        const requestBody = await route.request().postData();
        
        if (requestBody?.includes('refresh_token')) {
          tokenRefreshCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              access_token: 'new-access-token',
              refresh_token: 'new-refresh-token',
              user: { id: 'user-id', email: TEST_USERS.valid.email }
            })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              access_token: 'initial-access-token',
              refresh_token: 'initial-refresh-token',
              user: { id: 'user-id', email: TEST_USERS.valid.email }
            })
          });
        }
      });

      await authPage.goto();
      await authPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);
      await dashboardPage.expectToBeOnDashboard();
      
      // Simulate token expiration by waiting and triggering refresh
      await page.evaluate(() => {
        // Trigger a token refresh (this would normally happen automatically)
        window.dispatchEvent(new CustomEvent('token-refresh-needed'));
      });
      
      // Wait for potential token refresh
      await page.waitForTimeout(1000);
      
      expect(tokenRefreshCalled).toBeTruthy();
    });

    test('should logout and clear session data', async ({ authPage, dashboardPage, page }) => {
      // Mock login
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-access-token',
            user: { id: 'user-id', email: TEST_USERS.valid.email }
          })
        });
      });

      // Mock logout
      await page.route('**/auth/v1/logout**', async route => {
        await route.fulfill({ status: 204 });
      });

      await authPage.goto();
      await authPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password);
      await dashboardPage.expectToBeOnDashboard();
      
      // Logout
      await dashboardPage.logout();
      
      // Should redirect to login
      await expect(page).toHaveURL(new RegExp(TEST_URLS.login));
      
      // Check that session data is cleared
      const sessionData = await page.evaluate(() => {
        return localStorage.getItem('supabase.auth.token');
      });
      expect(sessionData).toBeNull();
    });

    test('should handle concurrent auth state changes', async ({ authPage, page }) => {
      // Mock multiple rapid auth state changes
      let callCount = 0;
      await page.route('**/auth/v1/token**', async route => {
        callCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: `token-${callCount}`,
            user: { id: 'user-id', email: TEST_USERS.valid.email }
          })
        });
      });

      // Simulate rapid login attempts
      await authPage.goto();
      
      const loginPromises = [];
      for (let i = 0; i < 3; i++) {
        loginPromises.push(
          authPage.login(TEST_USERS.valid.email, TEST_USERS.valid.password)
        );
      }
      
      // Wait for all login attempts
      await Promise.allSettled(loginPromises);
      
      // Should end up in authenticated state
      await expect(page).toHaveURL(new RegExp(TEST_URLS.dashboard));
    });
  });

  test.describe('Auth State Persistence', () => {
    test('should restore auth state from local storage', async ({ page, dashboardPage }) => {
      // Pre-populate auth state in localStorage
      await page.addInitScript(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'stored-access-token',
          refresh_token: 'stored-refresh-token',
          user: {
            id: 'stored-user-id',
            email: 'stored@example.com'
          },
          expires_at: Date.now() + 3600000 // 1 hour from now
        }));
      });

      // Mock session validation
      await page.route('**/auth/v1/user**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'stored-user-id',
            email: 'stored@example.com'
          })
        });
      });

      await dashboardPage.goto();
      await dashboardPage.expectToBeOnDashboard();
    });

    test('should clear invalid stored auth state', async ({ page, authPage }) => {
      // Pre-populate invalid auth state
      await page.addInitScript(() => {
        localStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: 'invalid-token',
          user: { id: 'invalid-user' },
          expires_at: Date.now() - 3600000 // Expired
        }));
      });

      // Mock validation failure
      await page.route('**/auth/v1/user**', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'invalid_token' })
        });
      });

      await page.goto(TEST_URLS.dashboard);
      
      // Should redirect to login and clear invalid state
      await authPage.expectToBeOnLoginPage();
      
      const storedAuth = await page.evaluate(() => {
        return localStorage.getItem('supabase.auth.token');
      });
      expect(storedAuth).toBeNull();
    });
  });
});
