import { test, expect } from '@playwright/test'
import type { Page, BrowserContext } from '@playwright/test'

// Helper function to simulate complete OAuth flow
async function simulateCompleteOAuthFlow(page: Page, provider: 'google' = 'google') {
  // Mock providers
  await page.route('**/api/auth/providers', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        [provider]: {
          id: provider,
          name: provider.charAt(0).toUpperCase() + provider.slice(1),
          type: 'oauth',
          signinUrl: `/api/auth/signin/${provider}`,
          callbackUrl: `/api/auth/callback/${provider}`
        }
      })
    })
  })

  // Mock OAuth initiation
  await page.route(`**/api/auth/signin/${provider}`, async route => {
    await route.fulfill({
      status: 302,
      headers: {
        'Location': `https://accounts.${provider}.com/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000/api/auth/callback/${provider}&state=test-state`
      }
    })
  })

  // Mock OAuth callback success
  await page.route(`**/api/auth/callback/${provider}*`, async route => {
    await route.fulfill({
      status: 302,
      headers: {
        'Location': '/dashboard'
      }
    })
  })

  // Mock session after OAuth
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        user: {
          id: `${provider}-user-123`,
          email: `user@${provider}.com`,
          name: `${provider.charAt(0).toUpperCase()}${provider.slice(1)} User`,
          image: `https://example.com/${provider}-avatar.jpg`,
          role: 'user'
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    })
  })
}

// Helper function to simulate complete email flow
async function simulateCompleteEmailFlow(page: Page, email: string = 'test@example.com') {
  // Mock email signin
  await page.route('**/api/auth/signin/email', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        url: '/auth/verify-request',
        email: email
      })
    })
  })

  // Mock email verification
  await page.route('**/api/auth/callback/email*', async route => {
    await route.fulfill({
      status: 302,
      headers: {
        'Location': '/dashboard'
      }
    })
  })

  // Mock session after email verification
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        user: {
          id: 'email-user-123',
          email: email,
          name: 'Email User',
          role: 'user'
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    })
  })
}

test.describe('Complete Authentication Flows', () => {
  test('should complete full Google OAuth sign-in flow', async ({ page }) => {
    await simulateCompleteOAuthFlow(page, 'google')

    // Start at signin page
    await page.goto('/auth/signin')
    await expect(page.getByRole('heading', { name: /welcome to miowsis/i })).toBeVisible()

    // Click Google sign-in
    await page.getByRole('button', { name: /continue with google/i }).click()

    // Should redirect through OAuth flow to dashboard
    await page.waitForURL('**/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    
    // User info should be displayed
    await expect(page.getByText(/google user/i)).toBeVisible()
  })

  test('should complete full email sign-in flow', async ({ page }) => {
    await simulateCompleteEmailFlow(page)

    // Start at signin page
    await page.goto('/auth/signin')
    
    // Fill email and submit
    await page.getByLabel('Email address').fill('test@example.com')
    await page.getByRole('button', { name: /continue with email/i }).click()

    // Should go to verification page
    await page.waitForURL('**/auth/verify-request')
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible()

    // Simulate clicking verification link
    await page.goto('/api/auth/callback/email?token=valid-token&email=test@example.com')

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('should handle complete logout flow', async ({ page, context }) => {
    await simulateCompleteOAuthFlow(page)

    // Sign in first
    await page.goto('/auth/signin')
    await page.getByRole('button', { name: /continue with google/i }).click()
    await page.waitForURL('**/dashboard')

    // Mock logout
    await page.route('**/api/auth/signout', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ url: '/auth/signin' })
      })
    })

    // Mock empty session after logout
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({})
      })
    })

    // Logout
    await page.getByRole('button', { name: /sign out/i }).click()

    // Should redirect to signin
    await page.waitForURL('**/auth/signin')
    await expect(page.getByRole('heading', { name: /welcome to miowsis/i })).toBeVisible()

    // Verify session is cleared by trying to access protected page
    await page.goto('/dashboard')
    await page.waitForURL('**/auth/signin*')
  })

  test('should handle protected route access without authentication', async ({ page }) => {
    // Mock unauthenticated session
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({})
      })
    })

    // Try to access protected route
    await page.goto('/dashboard')

    // Should redirect to signin with callback URL
    await page.waitForURL('**/auth/signin*')
    expect(page.url()).toContain('callbackUrl')
    expect(page.url()).toContain('dashboard')
  })

  test('should preserve callback URL through complete auth flow', async ({ page }) => {
    await simulateCompleteOAuthFlow(page)
    const targetPage = '/portfolios/123'

    // Mock final redirect to callback URL
    await page.route(`**/api/auth/callback/google*`, async route => {
      const url = new URL(route.request().url())
      const state = url.searchParams.get('state')
      
      await route.fulfill({
        status: 302,
        headers: {
          'Location': targetPage // Redirect to original target
        }
      })
    })

    // Try to access protected page
    await page.goto(targetPage)
    
    // Should redirect to signin with callback
    await page.waitForURL('**/auth/signin*')
    expect(page.url()).toContain(encodeURIComponent(targetPage))

    // Complete OAuth flow
    await page.getByRole('button', { name: /continue with google/i }).click()

    // Should end up at original target page
    await page.waitForURL(`**${targetPage}`)
  })

  test('should handle role-based access after authentication', async ({ page }) => {
    // Mock admin user session
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'admin-user-123',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin'
          },
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })

    await simulateCompleteOAuthFlow(page)

    // Complete signin
    await page.goto('/auth/signin')
    await page.getByRole('button', { name: /continue with google/i }).click()
    await page.waitForURL('**/dashboard')

    // Should be able to access admin pages
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /admin/i })).toBeVisible()

    // Should be able to access user pages
    await page.goto('/portfolios')
    await expect(page.getByRole('heading', { name: /portfolios/i })).toBeVisible()
  })

  test('should handle session refresh during long session', async ({ page, context }) => {
    await simulateCompleteOAuthFlow(page)

    // Set session cookie
    await context.addCookies([{
      name: 'next-auth.session-token',
      value: 'valid-session',
      domain: 'localhost',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    }])

    // Start authenticated
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Simulate time passing and session refresh
    let refreshCount = 0
    await page.route('**/api/auth/session', async route => {
      refreshCount++
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

    // Navigate to different pages (should trigger session checks)
    const pages = ['/portfolios', '/market', '/settings', '/profile']
    for (const pagePath of pages) {
      await page.goto(pagePath)
      await expect(page).toHaveURL(`**${pagePath}`)
    }

    // Session should have been refreshed
    expect(refreshCount).toBeGreaterThan(0)
  })

  test('should handle account switching flow', async ({ browser }) => {
    // Test switching between different user accounts
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()

    // First user signs in
    await simulateCompleteOAuthFlow(page1)
    await page1.goto('/auth/signin')
    await page1.getByRole('button', { name: /continue with google/i }).click()
    await page1.waitForURL('**/dashboard')
    await expect(page1.getByText(/google user/i)).toBeVisible()

    // Sign out first user
    await page1.route('**/api/auth/signout', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ url: '/auth/signin' })
      })
    })
    await page1.getByRole('button', { name: /sign out/i }).click()
    await page1.waitForURL('**/auth/signin')

    // Second user signs in with email
    await simulateCompleteEmailFlow(page1, 'second@example.com')
    await page1.getByLabel('Email address').fill('second@example.com')
    await page1.getByRole('button', { name: /continue with email/i }).click()
    await page1.waitForURL('**/auth/verify-request')
    
    // Simulate email verification
    await page1.goto('/api/auth/callback/email?token=valid-token&email=second@example.com')
    await page1.waitForURL('**/dashboard')
    await expect(page1.getByText(/email user/i)).toBeVisible()

    await context1.close()
  })

  test('should handle concurrent authentication across multiple tabs', async ({ context }) => {
    await simulateCompleteOAuthFlow(await context.newPage())

    // Open multiple tabs
    const tab1 = await context.newPage()
    const tab2 = await context.newPage()
    const tab3 = await context.newPage()

    // Authenticate in first tab
    await tab1.goto('/auth/signin')
    await tab1.getByRole('button', { name: /continue with google/i }).click()
    await tab1.waitForURL('**/dashboard')

    // Other tabs should also be authenticated
    await tab2.goto('/portfolios')
    await expect(tab2.getByRole('heading', { name: /portfolios/i })).toBeVisible()

    await tab3.goto('/market')
    await expect(tab3.getByRole('heading', { name: /market/i })).toBeVisible()

    await tab1.close()
    await tab2.close()
    await tab3.close()
  })

  test('should handle authentication with different device characteristics', async ({ browser }) => {
    // Test mobile authentication
    const mobileContext = await browser.newContext({
      ...browser.contexts()[0] || {},
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    })
    
    const mobilePage = await mobileContext.newPage()
    await simulateCompleteOAuthFlow(mobilePage)

    // Mobile signin should work
    await mobilePage.goto('/auth/signin')
    await expect(mobilePage.getByRole('heading', { name: /welcome to miowsis/i })).toBeVisible()
    await mobilePage.getByRole('button', { name: /continue with google/i }).click()
    await mobilePage.waitForURL('**/dashboard')
    await expect(mobilePage.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    await mobileContext.close()
  })

  test('should handle authentication errors and recovery', async ({ page }) => {
    // Start with failing OAuth
    await page.route('**/api/auth/callback/google*', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/auth/error?error=OAuthCallback'
        }
      })
    })

    await page.goto('/auth/signin')
    await page.getByRole('button', { name: /continue with google/i }).click()

    // Should show error
    await page.waitForURL('**/auth/error*')
    await expect(page.getByText(/error.*occurred/i)).toBeVisible()

    // Try again with working OAuth
    await simulateCompleteOAuthFlow(page)
    await page.getByRole('link', { name: /try again/i }).click()
    await page.waitForURL('**/auth/signin')
    
    // Second attempt should work
    await page.getByRole('button', { name: /continue with google/i }).click()
    await page.waitForURL('**/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })
})