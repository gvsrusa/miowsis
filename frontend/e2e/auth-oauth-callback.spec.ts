import { test, expect, TEST_USERS, TEST_URLS } from './fixtures/auth-fixtures';

test.describe('Authentication - OAuth Callback Handling', () => {
  test.describe('Successful OAuth Flow', () => {
    test('should handle successful Google OAuth callback', async ({ page, dashboardPage }) => {
      // Mock successful OAuth callback from Google
      await page.route('**/auth/v1/token**', async route => {
        const requestBody = await route.request().postData();
        
        if (requestBody?.includes('authorization_code')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              access_token: 'oauth-access-token',
              refresh_token: 'oauth-refresh-token',
              user: {
                id: 'oauth-user-id',
                email: 'oauth@example.com',
                user_metadata: {
                  first_name: 'John',
                  last_name: 'Doe',
                  avatar_url: 'https://example.com/avatar.jpg'
                },
                app_metadata: {
                  provider: 'google'
                }
              }
            })
          });
        }
      });

      // Mock user profile creation/retrieval
      await page.route('**/rest/v1/user_profiles**', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'profile-id',
              user_id: 'oauth-user-id',
              first_name: 'John',
              last_name: 'Doe',
              email: 'oauth@example.com'
            })
          });
        }
      });

      // Navigate to OAuth callback URL (simulates redirect from Google)
      await page.goto('/auth/callback?code=mock-auth-code&state=mock-state');
      
      // Should process the callback and redirect to dashboard
      await dashboardPage.expectToBeOnDashboard();
      await dashboardPage.expectWelcomeMessage('John');
    });

    test('should handle first-time OAuth user registration', async ({ page, dashboardPage }) => {
      // Mock OAuth callback with new user
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'new-oauth-token',
            user: {
              id: 'new-oauth-user',
              email: 'newuser@gmail.com',
              user_metadata: {
                first_name: 'Jane',
                last_name: 'Smith',
                avatar_url: 'https://lh3.googleusercontent.com/avatar'
              },
              app_metadata: {
                provider: 'google'
              },
              created_at: new Date().toISOString() // New user
            }
          })
        });
      });

      // Mock profile creation for new user
      await page.route('**/rest/v1/user_profiles**', async route => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-profile-id',
            user_id: 'new-oauth-user',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'newuser@gmail.com',
            avatar_url: 'https://lh3.googleusercontent.com/avatar',
            onboarding_completed: false
          })
        });
      });

      await page.goto('/auth/callback?code=new-user-code&state=registration');
      
      // New users should be redirected to onboarding
      await expect(page).toHaveURL(new RegExp('/onboarding'));
    });

    test('should handle returning OAuth user', async ({ page, dashboardPage }) => {
      // Mock OAuth callback with existing user
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'existing-oauth-token',
            user: {
              id: 'existing-oauth-user',
              email: 'existing@gmail.com',
              user_metadata: {
                first_name: 'Bob',
                last_name: 'Johnson'
              },
              app_metadata: {
                provider: 'google'
              },
              last_sign_in_at: new Date(Date.now() - 86400000).toISOString() // Last signed in yesterday
            }
          })
        });
      });

      // Mock existing profile retrieval
      await page.route('**/rest/v1/user_profiles**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'existing-profile-id',
            user_id: 'existing-oauth-user',
            first_name: 'Bob',
            last_name: 'Johnson',
            email: 'existing@gmail.com',
            onboarding_completed: true,
            kyc_status: 'approved'
          }])
        });
      });

      await page.goto('/auth/callback?code=existing-user-code');
      
      // Existing users should go directly to dashboard
      await dashboardPage.expectToBeOnDashboard();
      await dashboardPage.expectWelcomeMessage('Bob');
    });
  });

  test.describe('OAuth Error Handling', () => {
    test('should handle OAuth error from provider', async ({ page, authPage }) => {
      // Navigate to callback with error from OAuth provider
      await page.goto('/auth/callback?error=access_denied&error_description=User+denied+access');
      
      // Should redirect to login with error message
      await authPage.expectToBeOnLoginPage();
      await authPage.expectErrorMessage('OAuth authentication was cancelled');
    });

    test('should handle invalid authorization code', async ({ page, authPage }) => {
      // Mock invalid code error
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Invalid authorization code'
          })
        });
      });

      await page.goto('/auth/callback?code=invalid-code');
      
      await authPage.expectToBeOnLoginPage();
      await authPage.expectErrorMessage('OAuth authentication failed. Please try again.');
    });

    test('should handle expired authorization code', async ({ page, authPage }) => {
      // Mock expired code error
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Authorization code expired'
          })
        });
      });

      await page.goto('/auth/callback?code=expired-code');
      
      await authPage.expectToBeOnLoginPage();
      await authPage.expectErrorMessage('Authorization code has expired. Please try again.');
    });

    test('should handle missing authorization code', async ({ page, authPage }) => {
      // Navigate to callback without code parameter
      await page.goto('/auth/callback');
      
      await authPage.expectToBeOnLoginPage();
      await authPage.expectErrorMessage('Missing authorization code');
    });

    test('should handle network errors during token exchange', async ({ page, authPage }) => {
      // Mock network error
      await page.route('**/auth/v1/token**', async route => {
        await route.abort('connectionfailed');
      });

      await page.goto('/auth/callback?code=valid-code');
      
      await authPage.expectToBeOnLoginPage();
      await authPage.expectErrorMessage('Network error during authentication. Please try again.');
    });

    test('should handle state parameter mismatch', async ({ page, authPage }) => {
      // Mock state validation failure
      await page.addInitScript(() => {
        // Simulate stored state that doesn't match callback
        sessionStorage.setItem('oauth-state', 'expected-state');
      });

      await page.goto('/auth/callback?code=valid-code&state=wrong-state');
      
      await authPage.expectToBeOnLoginPage();
      await authPage.expectErrorMessage('Invalid authentication state. Please try again.');
    });
  });

  test.describe('OAuth Provider Edge Cases', () => {
    test('should handle user with no email from provider', async ({ page, authPage }) => {
      // Mock OAuth response with user but no email
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'no-email-token',
            user: {
              id: 'no-email-user',
              email: null,
              user_metadata: {
                first_name: 'Anonymous',
                last_name: 'User'
              },
              app_metadata: {
                provider: 'google'
              }
            }
          })
        });
      });

      await page.goto('/auth/callback?code=no-email-code');
      
      await authPage.expectToBeOnLoginPage();
      await authPage.expectErrorMessage('Email is required for account creation');
    });

    test('should handle OAuth user with existing email from different provider', async ({ page, authPage }) => {
      // Mock conflict error
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'email_address_already_confirmed',
            error_description: 'An account with this email already exists'
          })
        });
      });

      await page.goto('/auth/callback?code=conflict-code');
      
      await authPage.expectToBeOnLoginPage();
      await authPage.expectErrorMessage('An account with this email already exists. Please sign in with your original method.');
    });

    test('should handle OAuth provider rate limiting', async ({ page, authPage }) => {
      // Mock rate limit error
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'rate_limit_exceeded',
            error_description: 'Too many authentication attempts'
          })
        });
      });

      await page.goto('/auth/callback?code=rate-limited-code');
      
      await authPage.expectToBeOnLoginPage();
      await authPage.expectErrorMessage('Too many authentication attempts. Please try again later.');
    });

    test('should preserve return URL through OAuth flow', async ({ page, dashboardPage }) => {
      // Start OAuth flow from a specific page
      await page.goto('/portfolio');
      
      // Should redirect to login with return URL
      await expect(page).toHaveURL(/login.*returnUrl=%2Fportfolio/);
      
      // Start OAuth flow (would normally redirect to provider)
      await page.evaluate(() => {
        sessionStorage.setItem('oauth-return-url', '/portfolio');
      });
      
      // Mock successful OAuth return
      await page.route('**/auth/v1/token**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'return-url-token',
            user: {
              id: 'return-url-user',
              email: 'user@example.com',
              user_metadata: { first_name: 'User' }
            }
          })
        });
      });

      await page.goto('/auth/callback?code=return-url-code');
      
      // Should redirect to original destination
      await expect(page).toHaveURL(new RegExp('/portfolio'));
    });
  });

  test.describe('Loading and UI States', () => {
    test('should show loading state during OAuth processing', async ({ page }) => {
      // Mock slow token exchange
      await page.route('**/auth/v1/token**', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'slow-token',
            user: { id: 'slow-user', email: 'slow@example.com' }
          })
        });
      });

      await page.goto('/auth/callback?code=slow-code');
      
      // Should show loading indicator
      const loadingIndicator = page.locator('[data-testid="oauth-loading"]');
      await expect(loadingIndicator).toBeVisible();
      await expect(loadingIndicator).toContainText('Completing authentication...');
    });

    test('should handle browser back button during OAuth callback', async ({ page, authPage }) => {
      await page.goto('/login');
      await page.goto('/auth/callback?code=back-button-code');
      
      // Mock slow processing
      await page.route('**/auth/v1/token**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({ status: 200, body: '{}' });
      });
      
      // User hits back button during processing
      await page.goBack();
      
      // Should be back on login page
      await authPage.expectToBeOnLoginPage();
    });
  });
});
