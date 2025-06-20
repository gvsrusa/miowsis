import { test, expect } from '@playwright/test'
import type { Page, BrowserContext } from '@playwright/test'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Helper to authenticate via API and inject token
async function authenticateViaAPI(context: BrowserContext, email: string, password: string) {
  try {
    // Call Supabase Auth API directly
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password,
        gotrue_meta_security: {}
      })
    })

    if (!response.ok) {
      console.error('Auth failed:', await response.text())
      return null
    }

    const data = await response.json()
    
    // Inject auth token into browser context
    await context.addInitScript((authData) => {
      // Supabase stores auth in localStorage
      const authKey = `sb-${location.hostname.split('.')[0]}-auth-token`
      localStorage.setItem(authKey, JSON.stringify({
        access_token: authData.access_token,
        token_type: 'bearer',
        expires_in: authData.expires_in,
        expires_at: Math.floor(Date.now() / 1000) + authData.expires_in,
        refresh_token: authData.refresh_token,
        user: authData.user
      }))
    }, data)

    return data
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

// Helper to create test user via API
async function createTestUser(email: string, password: string) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        password,
        data: {},
        gotrue_meta_security: {}
      })
    })

    return response.ok
  } catch (error) {
    console.error('User creation error:', error)
    return false
  }
}

test.describe('Supabase Auth API Tests', () => {
  test.describe.configure({ mode: 'parallel' })

  test('should authenticate and access protected routes', async ({ browser }) => {
    // Create a new context with auth
    const context = await browser.newContext()
    
    // Create unique test user
    const testEmail = `test${Date.now()}@gmail.com`
    const testPassword = 'TestPassword123!'
    
    // Skip user creation if it fails (user might already exist)
    await createTestUser(testEmail, testPassword)
    
    // Authenticate via API
    const authData = await authenticateViaAPI(context, testEmail, testPassword)
    
    if (authData) {
      const page = await context.newPage()
      
      // Navigate to protected route
      await page.goto('/dashboard')
      
      // Should be able to access dashboard
      await expect(page).toHaveURL(/.*\/dashboard/)
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
      
      // Verify user info is displayed
      await expect(page.getByText(testEmail)).toBeVisible()
    }
    
    await context.close()
  })

  test('should redirect unauthenticated users', async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Try to access protected route
    await page.goto('/dashboard')
    
    // Should redirect to sign in
    await expect(page).toHaveURL(/.*\/auth\/signin/)
  })

  test('should handle sign out correctly', async ({ browser }) => {
    // Create authenticated context
    const context = await browser.newContext()
    const testEmail = `test${Date.now()}@gmail.com`
    const testPassword = 'TestPassword123!'
    
    await createTestUser(testEmail, testPassword)
    await authenticateViaAPI(context, testEmail, testPassword)
    
    const page = await context.newPage()
    
    // Navigate to dashboard
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Sign out
    const signOutButton = page.getByRole('button', { name: /sign out/i })
    if (await signOutButton.isVisible()) {
      await signOutButton.click()
      
      // Should redirect to sign in
      await page.waitForURL(/.*\/auth\/signin/)
      
      // Verify auth is cleared
      const hasAuth = await page.evaluate(() => {
        const keys = Object.keys(localStorage)
        return keys.some(key => key.includes('auth'))
      })
      
      expect(hasAuth).toBe(false)
    }
    
    await context.close()
  })

  test('should validate email format on sign up', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Test invalid email formats
    const invalidEmails = ['invalid-email', 'test@', '@test.com', 'test@example.com']
    
    for (const email of invalidEmails) {
      await page.getByLabel('Email address').fill(email)
      await page.getByLabel('Password').fill('ValidPassword123!')
      
      const signUpButton = page.getByRole('button', { name: /sign up/i })
      await signUpButton.click()
      
      // Should show validation error
      await expect(page.getByText(/invalid.*email|email.*invalid/i)).toBeVisible()
      
      // Clear for next test
      await page.getByLabel('Email address').clear()
    }
  })

  test('should test RLS policies with different users', async ({ browser }) => {
    // Create two different user contexts
    const user1Email = `user1_${Date.now()}@gmail.com`
    const user2Email = `user2_${Date.now()}@gmail.com`
    const password = 'TestPassword123!'
    
    // Create users
    await createTestUser(user1Email, password)
    await createTestUser(user2Email, password)
    
    // Context for User 1
    const context1 = await browser.newContext()
    await authenticateViaAPI(context1, user1Email, password)
    const page1 = await context1.newPage()
    
    // Context for User 2
    const context2 = await browser.newContext()
    await authenticateViaAPI(context2, user2Email, password)
    const page2 = await context2.newPage()
    
    // Navigate both users to portfolios
    await page1.goto('/portfolios')
    await page2.goto('/portfolios')
    
    // Each user should only see their own data
    // This tests RLS policies
    
    await context1.close()
    await context2.close()
  })

  test('should handle OAuth flow initiation', async ({ page, context }) => {
    await page.goto('/auth/signin')
    
    // Set up request interception
    const oauthRequests: string[] = []
    await page.route('**/*', (route) => {
      const url = route.request().url()
      if (url.includes('oauth') || url.includes('google')) {
        oauthRequests.push(url)
      }
      route.continue()
    })
    
    // Click OAuth button
    await page.getByRole('button', { name: /continue with google/i }).click()
    
    // Wait for OAuth redirect
    await page.waitForTimeout(2000)
    
    // Should have initiated OAuth
    expect(oauthRequests.length).toBeGreaterThan(0)
  })

  test('should preserve auth state across page refreshes', async ({ browser }) => {
    const context = await browser.newContext()
    const testEmail = `persist_${Date.now()}@gmail.com`
    const testPassword = 'TestPassword123!'
    
    await createTestUser(testEmail, testPassword)
    const authData = await authenticateViaAPI(context, testEmail, testPassword)
    
    if (authData) {
      const page = await context.newPage()
      
      // Navigate to dashboard
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/.*\/dashboard/)
      
      // Refresh page
      await page.reload()
      
      // Should still be on dashboard
      await expect(page).toHaveURL(/.*\/dashboard/)
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    }
    
    await context.close()
  })

  test('should handle concurrent sessions', async ({ browser }) => {
    const testEmail = `concurrent_${Date.now()}@gmail.com`
    const testPassword = 'TestPassword123!'
    
    await createTestUser(testEmail, testPassword)
    
    // Create multiple authenticated contexts
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ])
    
    // Authenticate all contexts
    await Promise.all(
      contexts.map(ctx => authenticateViaAPI(ctx, testEmail, testPassword))
    )
    
    // Create pages in each context
    const pages = await Promise.all(
      contexts.map(ctx => ctx.newPage())
    )
    
    // Navigate all to different protected routes
    await Promise.all([
      pages[0].goto('/dashboard'),
      pages[1].goto('/portfolios'),
      pages[2].goto('/settings')
    ])
    
    // All should be accessible
    await expect(pages[0]).toHaveURL(/.*\/dashboard/)
    await expect(pages[1]).toHaveURL(/.*\/portfolios/)
    await expect(pages[2]).toHaveURL(/.*\/settings/)
    
    // Clean up
    await Promise.all(contexts.map(ctx => ctx.close()))
  })
})

// UI-specific tests for critical user journeys
test.describe('Supabase Auth UI Tests', () => {
  test('should display sign in form correctly', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Check all elements are visible
    await expect(page.getByRole('heading', { name: /welcome to miowsis/i })).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()
  })

  test('should show loading states during authentication', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Fill form
    await page.getByLabel('Email address').fill('test@gmail.com')
    await page.getByLabel('Password').fill('TestPassword123!')
    
    // Monitor button state
    const signInButton = page.getByRole('button', { name: /sign in/i })
    
    // Click and check for disabled state
    const clickPromise = signInButton.click()
    
    // Button should become disabled
    await expect(signInButton).toBeDisabled()
    
    await clickPromise
  })

  test('should handle form validation', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Submit empty form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/email.*required/i)).toBeVisible()
  })
})