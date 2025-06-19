import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Helper to navigate to error page with specific error type
async function navigateToErrorPage(page: Page, error: string, details?: string) {
  let url = `/auth/error?error=${error}`
  if (details) {
    url += `&details=${encodeURIComponent(details)}`
  }
  await page.goto(url)
}

// Helper to mock different error responses
async function mockAuthError(page: Page, endpoint: string, errorType: string, statusCode: number = 400) {
  await page.route(endpoint, async route => {
    await route.fulfill({
      status: statusCode,
      body: JSON.stringify({
        error: errorType,
        message: `Authentication error: ${errorType}`
      })
    })
  })
}

test.describe('Authentication Error Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    // Start from signin page for most tests
    await page.goto('/auth/signin')
  })

  test('should display custom 404 error page', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/non-existent-page')
    
    // Should show custom 404 page
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible()
    await expect(page.getByText(/couldn.*find.*page/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /go home/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /go back/i })).toBeVisible()
  })

  test('should handle OAuth configuration errors', async ({ page }) => {
    await navigateToErrorPage(page, 'Configuration')
    
    await expect(page.getByRole('heading', { name: /authentication error/i })).toBeVisible()
    await expect(page.getByText(/temporarily unavailable/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /try again/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /contact support/i })).toBeVisible()
  })

  test('should handle OAuth access denied', async ({ page }) => {
    await navigateToErrorPage(page, 'AccessDenied')
    
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible()
    await expect(page.getByText(/denied access.*account/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /try.*different.*account/i })).toBeVisible()
  })

  test('should handle OAuth callback errors', async ({ page }) => {
    await navigateToErrorPage(page, 'OAuthCallback', 'invalid_grant')
    
    await expect(page.getByRole('heading', { name: /sign.*error/i })).toBeVisible()
    await expect(page.getByText(/error.*occurred.*sign/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /try again/i })).toBeVisible()
  })

  test('should handle email verification errors', async ({ page }) => {
    await navigateToErrorPage(page, 'Verification')
    
    await expect(page.getByRole('heading', { name: /verification.*error/i })).toBeVisible()
    await expect(page.getByText(/verification.*expired.*invalid/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /request.*new.*link/i })).toBeVisible()
  })

  test('should handle account linking errors', async ({ page }) => {
    await navigateToErrorPage(page, 'OAuthAccountNotLinked')
    
    await expect(page.getByRole('heading', { name: /account.*exists/i })).toBeVisible()
    await expect(page.getByText(/email.*already.*associated/i)).toBeVisible()
    await expect(page.getByText(/try.*signing.*different.*method/i)).toBeVisible()
  })

  test('should handle session required errors', async ({ page }) => {
    await navigateToErrorPage(page, 'SessionRequired')
    
    await expect(page.getByRole('heading', { name: /sign.*required/i })).toBeVisible()
    await expect(page.getByText(/sign.*access.*page/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })

  test('should handle credential sign-in errors', async ({ page }) => {
    await navigateToErrorPage(page, 'CredentialsSignin')
    
    await expect(page.getByRole('heading', { name: /invalid.*credentials/i })).toBeVisible()
    await expect(page.getByText(/email.*password.*incorrect/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /forgot.*password/i })).toBeVisible()
  })

  test('should handle email creation errors', async ({ page }) => {
    await navigateToErrorPage(page, 'EmailCreateAccount')
    
    await expect(page.getByRole('heading', { name: /account.*creation.*failed/i })).toBeVisible()
    await expect(page.getByText(/unable.*create.*account/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /try again/i })).toBeVisible()
  })

  test('should handle unknown error types gracefully', async ({ page }) => {
    await navigateToErrorPage(page, 'UnknownError')
    
    await expect(page.getByRole('heading', { name: /unexpected.*error/i })).toBeVisible()
    await expect(page.getByText(/something.*went.*wrong/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /try again/i })).toBeVisible()
  })

  test('should show debug information in development mode', async ({ page }) => {
    // Mock development environment
    await page.addInitScript(() => {
      (window as any).__NEXT_DATA__ = {
        buildId: 'development',
        dev: true
      }
    })
    
    await navigateToErrorPage(page, 'Configuration', 'Missing CLIENT_ID')
    
    // Should show debug info in development
    await expect(page.getByText(/debug.*information/i)).toBeVisible()
    await expect(page.getByText(/missing client_id/i)).toBeVisible()
  })

  test('should handle network connectivity errors', async ({ page }) => {
    // Mock network failure for auth endpoints
    await page.route('**/api/auth/**', async route => {
      await route.abort('failed')
    })

    // Try to sign in with email
    await page.getByLabel('Email address').fill('test@example.com')
    await page.getByRole('button', { name: /continue with email/i }).click()
    
    // Should show network error
    await expect(page.getByText(/unable.*connect/i)).toBeVisible()
    await expect(page.getByText(/check.*internet.*connection/i)).toBeVisible()
  })

  test('should handle API rate limiting errors', async ({ page }) => {
    await mockAuthError(page, '**/api/auth/signin/email', 'RateLimit', 429)

    // Try to sign in with email
    await page.getByLabel('Email address').fill('test@example.com')
    await page.getByRole('button', { name: /continue with email/i }).click()
    
    // Should show rate limit error
    await expect(page.getByText(/too.*many.*requests/i)).toBeVisible()
    await expect(page.getByText(/try.*again.*later/i)).toBeVisible()
  })

  test('should handle server internal errors', async ({ page }) => {
    await mockAuthError(page, '**/api/auth/signin/email', 'InternalError', 500)

    // Try to sign in with email
    await page.getByLabel('Email address').fill('test@example.com')
    await page.getByRole('button', { name: /continue with email/i }).click()
    
    // Should show server error
    await expect(page.getByText(/server.*error/i)).toBeVisible()
    await expect(page.getByText(/try.*again.*later/i)).toBeVisible()
  })

  test('should handle invalid email format errors', async ({ page }) => {
    // Fill invalid email and submit
    await page.getByLabel('Email address').fill('invalid-email-format')
    await page.getByRole('button', { name: /continue with email/i }).click()
    
    // Should show validation error
    await expect(page.getByText(/valid.*email.*address/i)).toBeVisible()
  })

  test('should handle empty form submission errors', async ({ page }) => {
    // Submit without filling form
    await page.getByRole('button', { name: /continue with email/i }).click()
    
    // Should show required field error
    await expect(page.getByText(/email.*required/i)).toBeVisible()
  })

  test('should handle OAuth provider not available', async ({ page }) => {
    // Mock providers endpoint returning empty
    await page.route('**/api/auth/providers', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({})
      })
    })

    await page.reload()
    
    // Google button should not be visible
    await expect(page.getByRole('button', { name: /continue with google/i })).not.toBeVisible()
    
    // Should show message about limited sign-in options
    await expect(page.getByText(/limited.*sign.*options/i)).toBeVisible()
  })

  test('should handle email sending failures', async ({ page }) => {
    // Mock email provider failure
    await page.route('**/api/auth/signin/email', async route => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({
          error: 'EmailSendError',
          message: 'Failed to send verification email'
        })
      })
    })

    // Try to sign in with email
    await page.getByLabel('Email address').fill('test@example.com')
    await page.getByRole('button', { name: /continue with email/i }).click()
    
    // Should show email sending error
    await expect(page.getByText(/unable.*send.*email/i)).toBeVisible()
    await expect(page.getByText(/email.*service.*temporarily.*unavailable/i)).toBeVisible()
  })

  test('should provide helpful error recovery options', async ({ page }) => {
    await navigateToErrorPage(page, 'Configuration')
    
    // Should provide multiple recovery options
    await expect(page.getByRole('link', { name: /try again/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /go home/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /contact support/i })).toBeVisible()
    
    // Test navigation to home
    await page.getByRole('link', { name: /go home/i }).click()
    await expect(page).toHaveURL('/')
  })

  test('should handle expired session during authentication', async ({ page, context }) => {
    // Set expired cookie
    await context.addCookies([{
      name: 'next-auth.session-token',
      value: 'expired-token',
      domain: 'localhost',
      path: '/',
      expires: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
    }])

    // Mock session check returning empty
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({})
      })
    })

    // Try to access protected page
    await page.goto('/dashboard')
    
    // Should redirect to sign-in with session expired message
    await page.waitForURL('**/auth/signin*')
    await expect(page.getByText(/session.*expired/i)).toBeVisible()
  })

  test('should handle browser back button on error pages', async ({ page }) => {
    // Start from signin, navigate to error
    await navigateToErrorPage(page, 'AccessDenied')
    await expect(page.getByRole('heading', { name: /access denied/i })).toBeVisible()
    
    // Use browser back button
    await page.goBack()
    
    // Should return to signin page
    await expect(page).toHaveURL('**/auth/signin')
    await expect(page.getByRole('heading', { name: /welcome to miowsis/i })).toBeVisible()
  })
})