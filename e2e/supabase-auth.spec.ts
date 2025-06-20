import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

// Test configuration - use real email domains for testing
const TEST_EMAIL = 'test@gmail.com' // Use real email domain, not example.com
const TEST_PASSWORD = 'Test123456!' // Strong password meeting Supabase requirements

// Helper to wait for navigation with timeout
async function waitForNavigation(page: Page, url: string, timeout = 30000) {
  await page.waitForURL(url, { timeout, waitUntil: 'networkidle' })
}

// Helper to fill auth form
async function fillAuthForm(page: Page, email: string, password: string) {
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(password)
}

test.describe('Supabase Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')
  })

  test('should display sign in page correctly', async ({ page }) => {
    // Check page elements
    await expect(page.getByRole('heading', { name: /welcome to miowsis/i })).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    // Test invalid email
    await fillAuthForm(page, 'invalid-email', TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Check for validation error
    await expect(page.getByText(/invalid email/i)).toBeVisible({ timeout: 5000 })
  })

  test('should validate password requirements', async ({ page }) => {
    // Navigate to sign up
    await page.getByRole('link', { name: /sign up/i }).click()
    await page.waitForURL('**/auth/signup')
    
    // Test weak password
    await fillAuthForm(page, TEST_EMAIL, '123')
    await page.getByRole('button', { name: /sign up/i }).click()
    
    // Check for password validation error
    await expect(page.getByText(/password.*at least/i)).toBeVisible({ timeout: 5000 })
  })

  test('should handle sign up flow', async ({ page }) => {
    // Navigate to sign up
    await page.getByRole('link', { name: /sign up/i }).click()
    await page.waitForURL('**/auth/signup')
    
    // Use timestamp to create unique email
    const uniqueEmail = `test${Date.now()}@gmail.com`
    
    // Fill sign up form
    await fillAuthForm(page, uniqueEmail, TEST_PASSWORD)
    
    // Confirm password field if exists
    const confirmPasswordField = page.getByLabel('Confirm Password')
    if (await confirmPasswordField.isVisible()) {
      await confirmPasswordField.fill(TEST_PASSWORD)
    }
    
    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click()
    
    // Should either redirect to verification page or dashboard
    await Promise.race([
      page.waitForURL('**/auth/verify-request', { timeout: 10000 }),
      page.waitForURL('**/dashboard', { timeout: 10000 }),
      page.waitForURL('**/onboarding', { timeout: 10000 })
    ])
    
    // If verification page, check for message
    if (page.url().includes('/auth/verify-request')) {
      await expect(page.getByText(/check your email/i)).toBeVisible()
    }
  })

  test('should handle Google OAuth initiation', async ({ page, context }) => {
    // Monitor network requests
    const oauthRequests: string[] = []
    page.on('request', request => {
      if (request.url().includes('google') || request.url().includes('oauth')) {
        oauthRequests.push(request.url())
      }
    })
    
    // Click Google sign in
    await page.getByRole('button', { name: /continue with google/i }).click()
    
    // Wait a bit for OAuth redirect
    await page.waitForTimeout(2000)
    
    // Should have initiated OAuth flow
    expect(oauthRequests.length).toBeGreaterThan(0)
  })

  test('should show loading states during authentication', async ({ page }) => {
    // Fill form
    await fillAuthForm(page, TEST_EMAIL, TEST_PASSWORD)
    
    // Get button before clicking
    const signInButton = page.getByRole('button', { name: /sign in/i })
    
    // Click and immediately check for disabled state
    await signInButton.click()
    
    // Button should be disabled during submission
    await expect(signInButton).toBeDisabled()
  })

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Try to sign in with wrong credentials
    await fillAuthForm(page, 'nonexistent@gmail.com', 'WrongPassword123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show error message
    await expect(page.getByText(/invalid.*credentials|authentication.*failed|incorrect.*email.*password/i)).toBeVisible({ 
      timeout: 10000 
    })
  })

  test('should navigate between sign in and sign up', async ({ page }) => {
    // Start at sign in
    await expect(page).toHaveURL(/.*\/auth\/signin/)
    
    // Navigate to sign up
    await page.getByRole('link', { name: /sign up/i }).click()
    await expect(page).toHaveURL(/.*\/auth\/signup/)
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible()
    
    // Navigate back to sign in
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/.*\/auth\/signin/)
  })

  test('should handle password reset flow', async ({ page }) => {
    // Click forgot password link if available
    const forgotPasswordLink = page.getByRole('link', { name: /forgot.*password/i })
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click()
      await page.waitForURL('**/auth/reset-password')
      
      // Enter email for reset
      await page.getByLabel('Email address').fill(TEST_EMAIL)
      await page.getByRole('button', { name: /reset.*password|send.*reset/i }).click()
      
      // Should show confirmation message
      await expect(page.getByText(/check.*email|reset.*sent/i)).toBeVisible({ timeout: 10000 })
    }
  })

  test('should persist auth state across page refreshes', async ({ page, context }) => {
    // Skip this test if we can't create a real session
    test.skip()
    
    // Would test session persistence if we had valid credentials
    // This would involve:
    // 1. Signing in successfully
    // 2. Refreshing the page
    // 3. Checking if still authenticated
  })
})

test.describe('Supabase Protected Routes', () => {
  test('should redirect unauthenticated users to sign in', async ({ page }) => {
    // Try to access protected routes
    const protectedRoutes = ['/dashboard', '/portfolios', '/settings', '/profile']
    
    for (const route of protectedRoutes) {
      await page.goto(route)
      
      // Should redirect to sign in
      await expect(page).toHaveURL(/.*\/auth\/signin/)
      
      // Should include callback URL
      expect(page.url()).toContain('callbackUrl')
    }
  })

  test('should handle deep linking with authentication', async ({ page }) => {
    const targetUrl = '/portfolios/123'
    
    // Try to access specific portfolio
    await page.goto(targetUrl)
    
    // Should redirect to sign in with callback
    await expect(page).toHaveURL(/.*\/auth\/signin/)
    expect(page.url()).toContain(encodeURIComponent(targetUrl))
  })
})

test.describe('Supabase Auth UI Integration', () => {
  test('should display all authentication options', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Check for email auth
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    
    // Check for social auth
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    
    // Check for divider
    await expect(page.getByText(/or continue with/i)).toBeVisible()
  })

  test('should handle form submission with Enter key', async ({ page }) => {
    await fillAuthForm(page, TEST_EMAIL, TEST_PASSWORD)
    
    // Press Enter in password field
    await page.getByLabel('Password').press('Enter')
    
    // Should trigger form submission
    const signInButton = page.getByRole('button', { name: /sign in/i })
    await expect(signInButton).toBeDisabled()
  })

  test('should show proper error for disposable email domains', async ({ page }) => {
    // Navigate to sign up
    await page.getByRole('link', { name: /sign up/i }).click()
    await page.waitForURL('**/auth/signup')
    
    // Try with example.com (blocked by Supabase)
    await fillAuthForm(page, 'test@example.com', TEST_PASSWORD)
    await page.getByRole('button', { name: /sign up/i }).click()
    
    // Should show error about invalid email
    await expect(page.getByText(/email.*invalid|not.*allowed/i)).toBeVisible({ timeout: 10000 })
  })
})