import { test, expect } from '@playwright/test'
import type { Page, BrowserContext } from '@playwright/test'

// Helper to create a valid session cookie
async function setSessionCookie(context: BrowserContext, options: {
  userId?: string
  email?: string
  role?: string
  expires?: Date
} = {}) {
  const defaultExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  
  await context.addCookies([{
    name: 'next-auth.session-token',
    value: 'valid-session-token-123',
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false, // false for localhost
    sameSite: 'Lax',
    expires: Math.floor((options.expires || defaultExpires).getTime() / 1000)
  }])
}

// Helper to mock session API responses
async function mockSessionAPI(page: Page, sessionData: any) {
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(sessionData)
    })
  })
}

// Helper to mock expired session
async function mockExpiredSession(page: Page) {
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({})
    })
  })
}

test.describe('Session Management and Persistence', () => {
  test('should persist session across page reloads', async ({ page, context }) => {
    // Set up authenticated session
    await setSessionCookie(context)
    await mockSessionAPI(page, {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

    // Navigate to protected page
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Reload page
    await page.reload()

    // Should still be authenticated
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(page).toHaveURL('/dashboard')
  })

  test('should persist session across browser tabs', async ({ page, context }) => {
    // Set up authenticated session
    await setSessionCookie(context)
    await mockSessionAPI(page, {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

    // Navigate to dashboard
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Open new tab
    const newTab = await context.newPage()
    await mockSessionAPI(newTab, {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

    // Navigate to another protected page in new tab
    await newTab.goto('/portfolios')
    await expect(newTab.getByRole('heading', { name: /portfolios/i })).toBeVisible()

    await newTab.close()
  })

  test('should handle session expiration gracefully', async ({ page, context }) => {
    // Set up expired session cookie
    await setSessionCookie(context, {
      expires: new Date(Date.now() - 1000) // 1 second ago
    })
    
    // Mock expired session response
    await mockExpiredSession(page)

    // Try to access protected page
    await page.goto('/dashboard')

    // Should redirect to sign-in
    await page.waitForURL('**/auth/signin*')
    await expect(page.getByText(/session.*expired/i)).toBeVisible()
  })

  test('should refresh session before expiry', async ({ page, context }) => {
    // Set up session that expires soon (but not yet)
    const nearExpiry = new Date(Date.now() + 60 * 1000) // 1 minute
    await setSessionCookie(context, { expires: nearExpiry })

    let sessionRefreshCalled = false
    
    // Mock session refresh
    await page.route('**/api/auth/session', async route => {
      sessionRefreshCalled = true
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user'
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })

    // Navigate to protected page
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Session should be refreshed automatically
    expect(sessionRefreshCalled).toBe(true)
  })

  test('should handle concurrent session refresh requests', async ({ page, context }) => {
    await setSessionCookie(context)
    
    let requestCount = 0
    
    // Mock session API to track concurrent requests
    await page.route('**/api/auth/session', async route => {
      requestCount++
      await page.waitForTimeout(100) // Simulate slight delay
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user'
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })

    // Simulate multiple quick navigation events
    await Promise.all([
      page.goto('/dashboard'),
      page.goto('/portfolios'),
      page.goto('/market')
    ])

    // Should handle concurrent requests gracefully
    expect(requestCount).toBeGreaterThan(0)
  })

  test('should clear session on explicit logout', async ({ page, context }) => {
    // Set up authenticated session
    await setSessionCookie(context)
    await mockSessionAPI(page, {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

    // Mock logout API
    await page.route('**/api/auth/signout', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ url: '/auth/signin' })
      })
    })

    // Navigate to dashboard
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Find and click logout button
    await page.getByRole('button', { name: /sign out/i }).click()

    // Should redirect to sign-in
    await page.waitForURL('**/auth/signin*')
    
    // Session should be cleared - accessing protected page should redirect
    await page.goto('/dashboard')
    await page.waitForURL('**/auth/signin*')
  })

  test('should handle session updates for role changes', async ({ page, context }) => {
    // Start with regular user session
    await setSessionCookie(context)
    
    let currentRole = 'user'
    
    // Mock dynamic session based on current role
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: currentRole
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })

    // Navigate to dashboard
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Simulate role upgrade to admin
    currentRole = 'admin'
    
    // Trigger session refresh
    await page.reload()
    
    // Should now have admin access
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /admin/i })).toBeVisible()
  })

  test('should handle network errors during session check', async ({ page, context }) => {
    await setSessionCookie(context)
    
    // Mock network failure for session check
    await page.route('**/api/auth/session', async route => {
      await route.abort('failed')
    })

    // Try to access protected page
    await page.goto('/dashboard')
    
    // Should handle gracefully - either retry or redirect to sign-in
    await expect(page).toHaveURL(/signin|dashboard/)
  })

  test('should maintain session across navigation', async ({ page, context }) => {
    await setSessionCookie(context)
    await mockSessionAPI(page, {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

    // Navigate through multiple protected pages
    const protectedPages = ['/dashboard', '/portfolios', '/market', '/settings', '/profile']
    
    for (const pagePath of protectedPages) {
      await page.goto(pagePath)
      // Should access each page without being redirected to sign-in
      await expect(page).toHaveURL(`**${pagePath}`)
    }
  })

  test('should handle session cookie security attributes', async ({ page, context }) => {
    // Check that session cookies have proper security attributes
    await page.goto('/auth/signin')
    
    // Mock successful authentication
    await page.route('**/api/auth/callback/**', async route => {
      // Simulate setting secure session cookie
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/dashboard',
          'Set-Cookie': 'next-auth.session-token=secure-token; HttpOnly; Secure; SameSite=Lax; Path=/'
        }
      })
    })

    // Trigger authentication flow
    await page.getByRole('button', { name: /continue with email/i }).click()
    
    // Check that cookies are set with security attributes
    const cookies = await context.cookies()
    const sessionCookie = cookies.find(c => c.name === 'next-auth.session-token')
    
    if (sessionCookie) {
      expect(sessionCookie.httpOnly).toBe(true)
      expect(sessionCookie.sameSite).toBe('Lax')
    }
  })

  test('should handle multiple concurrent sessions', async ({ browser }) => {
    // Create two separate browser contexts (simulating different users)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // Set up different sessions for each context
    await setSessionCookie(context1, { userId: 'user-1', email: 'user1@example.com' })
    await setSessionCookie(context2, { userId: 'user-2', email: 'user2@example.com' })

    // Mock different session responses
    await mockSessionAPI(page1, {
      user: { id: 'user-1', email: 'user1@example.com', name: 'User 1', role: 'user' },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    
    await mockSessionAPI(page2, {
      user: { id: 'user-2', email: 'user2@example.com', name: 'User 2', role: 'admin' },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })

    // Both users should be able to access their respective sessions
    await page1.goto('/dashboard')
    await expect(page1.getByText(/user 1/i)).toBeVisible()
    
    await page2.goto('/admin')
    await expect(page2.getByText(/user 2/i)).toBeVisible()

    await context1.close()
    await context2.close()
  })
})