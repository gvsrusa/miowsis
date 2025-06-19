import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })
  
  test('should display sign in page', async ({ page }) => {
    // Check for sign in elements
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })
  
  test('should show validation errors for empty form', async ({ page }) => {
    // Click sign in without filling form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Check for validation messages
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })
  
  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByPlaceholder(/email/i).fill('invalid@example.com')
    await page.getByPlaceholder(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Check for error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
  })
  
  test('should successfully sign in with valid credentials', async ({ page }) => {
    // Mock successful authentication
    await page.route('**/api/auth/callback/credentials', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ url: '/dashboard' })
      })
    })
    
    // Fill in valid credentials
    await page.getByPlaceholder(/email/i).fill('test@example.com')
    await page.getByPlaceholder(/password/i).fill('validpassword123')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })
  
  test('should navigate to sign up page', async ({ page }) => {
    // Click on sign up link
    await page.getByRole('link', { name: /sign up/i }).click()
    
    // Should be on sign up page
    await expect(page).toHaveURL('/auth/signup')
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible()
  })
  
  test('should complete sign up flow', async ({ page }) => {
    // Navigate to sign up
    await page.goto('/auth/signup')
    
    // Fill in sign up form
    await page.getByPlaceholder(/full name/i).fill('Test User')
    await page.getByPlaceholder(/email/i).fill('newuser@example.com')
    await page.getByPlaceholder(/password/i).fill('SecurePassword123!')
    await page.getByPlaceholder(/confirm password/i).fill('SecurePassword123!')
    
    // Accept terms
    await page.getByRole('checkbox', { name: /terms/i }).check()
    
    // Mock successful sign up
    await page.route('**/api/auth/signup', async route => {
      await route.fulfill({
        status: 201,
        body: JSON.stringify({ success: true })
      })
    })
    
    // Submit form
    await page.getByRole('button', { name: /create account/i }).click()
    
    // Should show success message and redirect
    await expect(page.getByText(/account created successfully/i)).toBeVisible()
    await expect(page).toHaveURL('/auth/signin')
  })
  
  test('should handle password reset flow', async ({ page }) => {
    // Click forgot password
    await page.getByRole('link', { name: /forgot password/i }).click()
    
    // Should be on reset page
    await expect(page).toHaveURL('/auth/reset-password')
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible()
    
    // Fill in email
    await page.getByPlaceholder(/email/i).fill('test@example.com')
    
    // Mock password reset request
    await page.route('**/api/auth/reset-password', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ message: 'Reset email sent' })
      })
    })
    
    // Submit
    await page.getByRole('button', { name: /send reset link/i }).click()
    
    // Should show success message
    await expect(page.getByText(/reset link sent/i)).toBeVisible()
  })
  
  test('should handle session expiry', async ({ page, context }) => {
    // Set up authenticated state
    await context.addCookies([{
      name: 'next-auth.session-token',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Date.now() / 1000 + 3600 // 1 hour from now
    }])
    
    // Navigate to protected page
    await page.goto('/dashboard')
    
    // Mock session check returning expired
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({})
      })
    })
    
    // Trigger session check
    await page.reload()
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/auth/signin')
    await expect(page.getByText(/session expired/i)).toBeVisible()
  })
})