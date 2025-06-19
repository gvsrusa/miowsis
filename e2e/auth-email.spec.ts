import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Helper function to fill email signin form
async function fillEmailSigninForm(page: Page, email: string) {
  await page.getByLabel('Email address').fill(email)
}

// Helper function to wait for email verification
async function waitForEmailVerification(page: Page) {
  await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible()
  await expect(page.getByText(/verification link/i)).toBeVisible()
}

test.describe('Email Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
  })

  test('should display email signin form', async ({ page }) => {
    // Check for email signin elements
    await expect(page.getByRole('heading', { name: /welcome to miowsis/i })).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByRole('button', { name: /continue with email/i })).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    // Test invalid email formats
    await fillEmailSigninForm(page, 'invalid-email')
    await page.getByRole('button', { name: /continue with email/i }).click()
    
    // Should show validation error
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible()
  })

  test('should handle empty email submission', async ({ page }) => {
    // Click submit without entering email
    await page.getByRole('button', { name: /continue with email/i }).click()
    
    // Should show required field error
    await expect(page.getByText(/email.*required/i)).toBeVisible()
  })

  test('should successfully submit email for verification', async ({ page }) => {
    // Mock the email provider API
    await page.route('**/api/auth/signin/email', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          url: '/auth/verify-request',
          email: 'test@example.com'
        })
      })
    })

    // Fill and submit email
    await fillEmailSigninForm(page, 'test@example.com')
    await page.getByRole('button', { name: /continue with email/i }).click()
    
    // Should redirect to verification page
    await page.waitForURL('**/auth/verify-request')
    await waitForEmailVerification(page)
  })

  test('should handle email verification link', async ({ page, context }) => {
    // Mock session creation after email verification
    await page.route('**/api/auth/session', async route => {
      const method = route.request().method()
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              name: 'Test User',
              role: 'user'
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        })
      } else {
        await route.continue()
      }
    })

    // Simulate clicking email verification link
    const verificationToken = 'test-verification-token'
    await page.goto(`/auth/verify?token=${verificationToken}&email=test@example.com`)
    
    // Should redirect to dashboard after successful verification
    await page.waitForURL('**/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('should handle expired verification tokens', async ({ page }) => {
    // Mock expired token response
    await page.route('**/api/auth/callback/email', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/auth/error?error=Verification'
        }
      })
    })

    // Try to use expired token
    await page.goto('/auth/verify?token=expired-token&email=test@example.com')
    
    // Should show error page
    await page.waitForURL('**/auth/error*')
    await expect(page.getByText(/verification.*expired/i)).toBeVisible()
  })

  test('should pre-fill email from URL parameter', async ({ page }) => {
    // Navigate with email parameter
    await page.goto('/auth/signin?email=prefilled@example.com')
    
    // Email should be pre-filled
    await expect(page.getByLabel('Email address')).toHaveValue('prefilled@example.com')
  })

  test('should handle rate limiting for email requests', async ({ page }) => {
    // Mock rate limit response
    await page.route('**/api/auth/signin/email', async route => {
      await route.fulfill({
        status: 429,
        body: JSON.stringify({ 
          error: 'Too many requests. Please try again later.'
        })
      })
    })

    // Try to submit email
    await fillEmailSigninForm(page, 'test@example.com')
    await page.getByRole('button', { name: /continue with email/i }).click()
    
    // Should show rate limit error
    await expect(page.getByText(/too many requests/i)).toBeVisible()
  })

  test('should handle server errors gracefully', async ({ page }) => {
    // Mock server error
    await page.route('**/api/auth/signin/email', async route => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ 
          error: 'Internal server error'
        })
      })
    })

    // Try to submit email
    await fillEmailSigninForm(page, 'test@example.com')
    await page.getByRole('button', { name: /continue with email/i }).click()
    
    // Should show error message
    await expect(page.getByText(/authentication.*temporarily unavailable/i)).toBeVisible()
  })

  test('should show loading state during email submission', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/auth/signin/email', async route => {
      await page.waitForTimeout(2000) // Simulate slow response
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ url: '/auth/verify-request' })
      })
    })

    // Fill and submit email
    await fillEmailSigninForm(page, 'test@example.com')
    const submitButton = page.getByRole('button', { name: /continue with email/i })
    await submitButton.click()
    
    // Button should show loading state
    await expect(submitButton).toBeDisabled()
    await expect(page.getByText(/sending/i)).toBeVisible()
  })
})