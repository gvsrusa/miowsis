import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Helper to mock Google OAuth responses
async function mockGoogleOAuthFlow(page: Page, options: {
  success?: boolean
  error?: string
  userData?: any
} = { success: true }) {
  // Mock the OAuth provider endpoint
  await page.route('**/api/auth/providers', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        google: {
          id: 'google',
          name: 'Google',
          type: 'oauth',
          signinUrl: '/api/auth/signin/google',
          callbackUrl: '/api/auth/callback/google'
        }
      })
    })
  })

  // Mock Google OAuth initiation
  await page.route('**/api/auth/signin/google', async route => {
    if (options.success) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          url: 'https://accounts.google.com/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000/api/auth/callback/google'
        })
      })
    } else {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ error: options.error || 'OAuth configuration error' })
      })
    }
  })

  // Mock OAuth callback
  await page.route('**/api/auth/callback/google*', async route => {
    if (options.success) {
      // Redirect to success or dashboard
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/dashboard'
        }
      })
    } else {
      // Redirect to error page
      await route.fulfill({
        status: 302,
        headers: {
          'Location': `/auth/error?error=${options.error || 'OAuthCallback'}`
        }
      })
    }
  })

  // Mock session after successful OAuth
  if (options.success) {
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: options.userData || {
            id: 'google-user-id',
            email: 'googleuser@gmail.com',
            name: 'Google User',
            image: 'https://lh3.googleusercontent.com/a/test-image',
            role: 'user'
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })
  }
}

test.describe('Google OAuth Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
  })

  test('should display Google sign-in button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()
  })

  test('should initiate Google OAuth flow', async ({ page }) => {
    await mockGoogleOAuthFlow(page)
    
    // Track navigation
    let googleAuthUrl = ''
    page.on('framenavigated', frame => {
      if (frame.url().includes('accounts.google.com')) {
        googleAuthUrl = frame.url()
      }
    })

    // Click Google sign-in
    await page.getByRole('button', { name: /continue with google/i }).click()
    
    // Should attempt to redirect to Google OAuth
    await expect(page).toHaveURL(/accounts\.google\.com|api\/auth\/signin\/google/i)
  })

  test('should handle successful Google OAuth callback', async ({ page }) => {
    await mockGoogleOAuthFlow(page, {
      success: true,
      userData: {
        id: 'test-google-id',
        email: 'testuser@gmail.com',
        name: 'Test User',
        image: 'https://example.com/photo.jpg',
        role: 'user'
      }
    })

    // Simulate OAuth callback with code
    await page.goto('/api/auth/callback/google?code=test-auth-code&state=test-state')
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard')
    await expect(page.getByText(/welcome.*test user/i)).toBeVisible()
  })

  test('should handle Google OAuth access denied', async ({ page }) => {
    await mockGoogleOAuthFlow(page, {
      success: false,
      error: 'AccessDenied'
    })

    // Simulate OAuth callback with error
    await page.goto('/api/auth/callback/google?error=access_denied')
    
    // Should redirect to error page
    await page.waitForURL('**/auth/error*')
    await expect(page.getByText(/access denied/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /try again/i })).toBeVisible()
  })

  test('should handle OAuth configuration errors', async ({ page }) => {
    // Mock missing Google credentials
    await page.route('**/api/auth/providers', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({}) // No Google provider
      })
    })

    // Try to find Google button - should not exist
    await expect(page.getByRole('button', { name: /continue with google/i })).not.toBeVisible()
  })

  test('should handle OAuth callback without code', async ({ page }) => {
    await mockGoogleOAuthFlow(page, {
      success: false,
      error: 'OAuthCallback'
    })

    // Navigate to callback without code
    await page.goto('/api/auth/callback/google')
    
    // Should redirect to error page
    await page.waitForURL('**/auth/error*')
    await expect(page.getByText(/error.*sign in/i)).toBeVisible()
  })

  test('should handle OAuth state mismatch', async ({ page }) => {
    await mockGoogleOAuthFlow(page, {
      success: false,
      error: 'OAuthCallback'
    })

    // Simulate callback with mismatched state
    await page.goto('/api/auth/callback/google?code=test-code&state=invalid-state')
    
    // Should show error
    await page.waitForURL('**/auth/error*')
    await expect(page.getByText(/error.*occurred/i)).toBeVisible()
  })

  test('should preserve callback URL through OAuth flow', async ({ page }) => {
    const callbackUrl = '/portfolios/123'
    await mockGoogleOAuthFlow(page)

    // Navigate with callback URL
    await page.goto(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    
    // Mock callback to preserve the URL
    await page.route('**/api/auth/callback/google*', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': callbackUrl
        }
      })
    })

    // Click Google sign-in
    await page.getByRole('button', { name: /continue with google/i }).click()
    
    // Simulate successful callback
    await page.goto('/api/auth/callback/google?code=test-code&state=test-state')
    
    // Should redirect to original callback URL
    await page.waitForURL(`**${callbackUrl}`)
  })

  test('should handle network errors during OAuth', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/auth/signin/google', async route => {
      await route.abort('failed')
    })

    // Try to sign in with Google
    await page.getByRole('button', { name: /continue with google/i }).click()
    
    // Should show error message
    await expect(page.getByText(/unable to connect/i)).toBeVisible({ timeout: 10000 })
  })

  test('should show loading state during OAuth initiation', async ({ page }) => {
    // Mock slow OAuth response
    await page.route('**/api/auth/signin/google', async route => {
      await page.waitForTimeout(2000)
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ url: 'https://accounts.google.com/oauth/authorize' })
      })
    })

    // Click Google sign-in
    const googleButton = page.getByRole('button', { name: /continue with google/i })
    await googleButton.click()
    
    // Should show loading state
    await expect(googleButton).toBeDisabled()
    await expect(page.getByText(/connecting/i)).toBeVisible()
  })

  test('should handle duplicate OAuth account linking', async ({ page }) => {
    await mockGoogleOAuthFlow(page, {
      success: false,
      error: 'OAuthAccountNotLinked'
    })

    // Simulate OAuth callback for existing email
    await page.goto('/api/auth/callback/google?code=test-code')
    
    // Should show account linking error
    await page.waitForURL('**/auth/error*')
    await expect(page.getByText(/account.*already exists/i)).toBeVisible()
    await expect(page.getByText(/different sign.*method/i)).toBeVisible()
  })
})