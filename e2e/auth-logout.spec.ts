import { test, expect } from '@playwright/test'
import type { Page, BrowserContext } from '@playwright/test'

// Helper to set up authenticated session
async function setupAuthenticatedSession(context: BrowserContext, page: Page, userData = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user'
}) {
  // Set session cookie
  await context.addCookies([{
    name: 'next-auth.session-token',
    value: 'valid-session-token',
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
    expires: Math.floor(Date.now() / 1000) + 3600 // 1 hour
  }])

  // Mock session API
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        user: userData,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    })
  })
}

// Helper to mock logout API
async function mockLogoutAPI(page: Page, options: {
  success?: boolean
  redirectUrl?: string
  error?: string
} = { success: true }) {
  await page.route('**/api/auth/signout', async route => {
    if (options.success) {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          url: options.redirectUrl || '/auth/signin'
        })
      })
    } else {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({
          error: options.error || 'Logout failed'
        })
      })
    }
  })
}

// Helper to mock empty session (logged out state)
async function mockLoggedOutSession(page: Page) {
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({})
    })
  })
}

test.describe('Logout Functionality', () => {
  test('should successfully log out from dashboard', async ({ page, context }) => {
    await setupAuthenticatedSession(context, page)
    await mockLogoutAPI(page)

    // Start authenticated on dashboard
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByText(/test user/i)).toBeVisible()

    // Find and click logout button
    await page.getByRole('button', { name: /sign out/i }).click()

    // Should redirect to signin page
    await page.waitForURL('**/auth/signin')
    await expect(page.getByRole('heading', { name: /welcome to miowsis/i })).toBeVisible()
  })

  test('should clear session after logout', async ({ page, context }) => {
    await setupAuthenticatedSession(context, page)
    await mockLogoutAPI(page)

    // Start authenticated
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Logout
    await page.getByRole('button', { name: /sign out/i }).click()
    await page.waitForURL('**/auth/signin')

    // Mock empty session after logout
    await mockLoggedOutSession(page)

    // Try to access protected page - should redirect
    await page.goto('/dashboard')
    await page.waitForURL('**/auth/signin*')
    await expect(page.getByText(/sign.*required/i)).toBeVisible()
  })

  test('should handle logout from different pages', async ({ page, context }) => {
    await setupAuthenticatedSession(context, page)
    await mockLogoutAPI(page)

    const protectedPages = ['/portfolios', '/market', '/settings', '/profile']

    for (const pagePath of protectedPages) {
      await page.goto(pagePath)
      await expect(page).toHaveURL(`**${pagePath}`)
      
      // Logout from this page
      await page.getByRole('button', { name: /sign out/i }).click()
      await page.waitForURL('**/auth/signin')
      
      // Set up session again for next iteration
      await setupAuthenticatedSession(context, page)
    }
  })

  test('should handle logout confirmation dialog', async ({ page, context }) => {
    await setupAuthenticatedSession(context, page)
    
    // Mock logout confirmation requirement
    let confirmationShown = false
    await page.addInitScript(() => {
      const originalConfirm = window.confirm
      window.confirm = (message: string) => {
        if (message.toLowerCase().includes('sign out')) {
          return true // Confirm logout
        }
        return originalConfirm(message)
      }
    })

    await mockLogoutAPI(page)

    await page.goto('/dashboard')
    await page.getByRole('button', { name: /sign out/i }).click()

    // Should still logout successfully
    await page.waitForURL('**/auth/signin')
  })

  test('should handle logout errors gracefully', async ({ page, context }) => {
    await setupAuthenticatedSession(context, page)
    await mockLogoutAPI(page, { success: false, error: 'Server error' })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: /sign out/i }).click()

    // Should show error message but still clear local session
    await expect(page.getByText(/logout.*failed/i)).toBeVisible()
    
    // Local session should still be cleared
    await mockLoggedOutSession(page)
    await page.goto('/dashboard')
    await page.waitForURL('**/auth/signin*')
  })

  test('should handle logout with custom redirect URL', async ({ page, context }) => {
    await setupAuthenticatedSession(context, page)
    await mockLogoutAPI(page, { redirectUrl: '/' })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: /sign out/i }).click()

    // Should redirect to home page instead of signin
    await page.waitForURL('/')
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
  })

  test('should handle logout across multiple tabs', async ({ context }) => {
    // Create multiple tabs
    const tab1 = await context.newPage()
    const tab2 = await context.newPage()
    const tab3 = await context.newPage()

    // Set up authenticated session for all tabs
    await setupAuthenticatedSession(context, tab1)
    await setupAuthenticatedSession(context, tab2)
    await setupAuthenticatedSession(context, tab3)
    await mockLogoutAPI(tab1)

    // Navigate to different pages in each tab
    await tab1.goto('/dashboard')
    await tab2.goto('/portfolios')
    await tab3.goto('/market')

    await expect(tab1.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(tab2.getByRole('heading', { name: /portfolios/i })).toBeVisible()
    await expect(tab3.getByRole('heading', { name: /market/i })).toBeVisible()

    // Logout from first tab
    await tab1.getByRole('button', { name: /sign out/i }).click()
    await tab1.waitForURL('**/auth/signin')

    // Other tabs should also become unauthenticated
    await mockLoggedOutSession(tab2)
    await mockLoggedOutSession(tab3)

    await tab2.reload()
    await tab2.waitForURL('**/auth/signin*')

    await tab3.reload()
    await tab3.waitForURL('**/auth/signin*')

    await tab1.close()
    await tab2.close()
    await tab3.close()
  })

  test('should handle logout with active form submissions', async ({ page, context }) => {
    await setupAuthenticatedSession(context, page)
    await mockLogoutAPI(page)

    // Navigate to a page with forms (settings)
    await page.goto('/settings')
    
    // Start filling a form
    const emailInput = page.getByLabel(/email/i)
    if (await emailInput.isVisible()) {
      await emailInput.fill('newemail@example.com')
    }

    // Logout while form is being edited
    await page.getByRole('button', { name: /sign out/i }).click()
    await page.waitForURL('**/auth/signin')

    // Should handle logout gracefully without errors
    await expect(page.getByRole('heading', { name: /welcome to miowsis/i })).toBeVisible()
  })

  test('should handle logout during network issues', async ({ page, context }) => {
    await setupAuthenticatedSession(context, page)
    
    // Mock network failure for logout
    await page.route('**/api/auth/signout', async route => {
      await route.abort('failed')
    })

    await page.goto('/dashboard')
    await page.getByRole('button', { name: /sign out/i }).click()

    // Should handle network error gracefully
    await expect(page.getByText(/unable.*sign.*out/i)).toBeVisible()
    
    // But local session should still be cleared
    await mockLoggedOutSession(page)
    await page.goto('/dashboard')
    await page.waitForURL('**/auth/signin*')
  })

  test('should preserve logout state across page refreshes', async ({ page, context }) => {
    await setupAuthenticatedSession(context, page)
    await mockLogoutAPI(page)

    // Logout
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /sign out/i }).click()
    await page.waitForURL('**/auth/signin')

    // Mock logged out session
    await mockLoggedOutSession(page)

    // Refresh the page
    await page.reload()
    
    // Should still be on signin page
    await expect(page.getByRole('heading', { name: /welcome to miowsis/i })).toBeVisible()
    
    // Try to access protected page
    await page.goto('/dashboard')
    await page.waitForURL('**/auth/signin*')
  })

  test('should handle logout for different user roles', async ({ page, context }) => {
    // Test admin logout
    await setupAuthenticatedSession(context, page, {
      id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin'
    })
    await mockLogoutAPI(page)

    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /admin/i })).toBeVisible()
    
    await page.getByRole('button', { name: /sign out/i }).click()
    await page.waitForURL('**/auth/signin')

    // After logout, should not be able to access admin pages
    await mockLoggedOutSession(page)
    await page.goto('/admin')
    await page.waitForURL('**/auth/signin*')
  })

  test('should handle logout from mobile devices', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
    })

    const mobilePage = await mobileContext.newPage()
    await setupAuthenticatedSession(mobileContext, mobilePage)
    await mockLogoutAPI(mobilePage)

    await mobilePage.goto('/dashboard')
    
    // On mobile, logout might be in a menu
    const menuButton = mobilePage.getByRole('button', { name: /menu/i })
    if (await menuButton.isVisible()) {
      await menuButton.click()
    }
    
    await mobilePage.getByRole('button', { name: /sign out/i }).click()
    await mobilePage.waitForURL('**/auth/signin')
    
    await expect(mobilePage.getByRole('heading', { name: /welcome to miowsis/i })).toBeVisible()

    await mobileContext.close()
  })

  test('should show loading state during logout', async ({ page, context }) => {
    await setupAuthenticatedSession(context, page)
    
    // Mock slow logout response
    await page.route('**/api/auth/signout', async route => {
      await page.waitForTimeout(2000) // 2 second delay
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ url: '/auth/signin' })
      })
    })

    await page.goto('/dashboard')
    const signoutButton = page.getByRole('button', { name: /sign out/i })
    await signoutButton.click()

    // Should show loading state
    await expect(signoutButton).toBeDisabled()
    await expect(page.getByText(/signing.*out/i)).toBeVisible()
    
    // Eventually should complete
    await page.waitForURL('**/auth/signin', { timeout: 5000 })
  })

  test('should handle simultaneous logout attempts', async ({ page, context }) => {
    await setupAuthenticatedSession(context, page)
    
    let logoutCallCount = 0
    await page.route('**/api/auth/signout', async route => {
      logoutCallCount++
      await page.waitForTimeout(1000)
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ url: '/auth/signin' })
      })
    })

    await page.goto('/dashboard')
    
    // Click logout button multiple times quickly
    const signoutButton = page.getByRole('button', { name: /sign out/i })
    await Promise.all([
      signoutButton.click(),
      signoutButton.click(),
      signoutButton.click()
    ])

    await page.waitForURL('**/auth/signin')
    
    // Should only make one logout call
    expect(logoutCallCount).toBe(1)
  })
})