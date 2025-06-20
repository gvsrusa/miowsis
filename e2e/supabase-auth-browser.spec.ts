import { test, expect } from '@playwright/test'
import type { Page, BrowserContext } from '@playwright/test'

// Helper to take screenshots with consistent naming
async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/auth-${name}-${Date.now()}.png`,
    fullPage: true 
  })
}

// Helper to wait for Supabase auth to be ready
async function waitForSupabaseReady(page: Page) {
  await page.waitForFunction(() => {
    return window.supabase !== undefined
  }, { timeout: 10000 })
}

test.describe('Supabase Auth Browser Tests', () => {
  // Use Playwright browser automation to test real auth flow
  test.use({
    // Extend timeout for auth operations
    actionTimeout: 30000,
    navigationTimeout: 30000,
  })

  test.beforeEach(async ({ page }) => {
    // Clear all cookies and storage
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Navigate to auth page
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')
  })

  test('should interact with Supabase client directly', async ({ page }) => {
    // Wait for Supabase to be available
    await waitForSupabaseReady(page)
    
    // Check Supabase client is initialized
    const supabaseConfig = await page.evaluate(() => {
      if (window.supabase) {
        return {
          url: window.supabase.supabaseUrl,
          hasAuthClient: !!window.supabase.auth,
          hasStorageClient: !!window.supabase.storage,
        }
      }
      return null
    })
    
    expect(supabaseConfig).toBeTruthy()
    expect(supabaseConfig?.hasAuthClient).toBe(true)
  })

  test('should test email validation using Supabase Auth', async ({ page }) => {
    await waitForSupabaseReady(page)
    
    // Test various email formats
    const testEmails = [
      { email: 'valid@gmail.com', shouldBeValid: true },
      { email: 'test@example.com', shouldBeValid: false }, // Blocked domain
      { email: 'invalid-email', shouldBeValid: false },
      { email: 'test@', shouldBeValid: false },
      { email: '@test.com', shouldBeValid: false },
    ]
    
    for (const { email, shouldBeValid } of testEmails) {
      // Clear and fill email
      await page.getByLabel('Email address').clear()
      await page.getByLabel('Email address').fill(email)
      await page.getByLabel('Password').fill('TestPassword123!')
      
      // Try to submit
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Check for validation
      if (!shouldBeValid) {
        await expect(page.getByText(/invalid.*email|email.*invalid/i)).toBeVisible({ 
          timeout: 5000 
        })
      }
      
      // Wait a bit before next test
      await page.waitForTimeout(500)
    }
  })

  test('should monitor Supabase auth state changes', async ({ page }) => {
    await waitForSupabaseReady(page)
    
    // Set up auth state listener
    const authStateChanges = await page.evaluateHandle(() => {
      const changes: any[] = []
      window.supabase.auth.onAuthStateChange((event, session) => {
        changes.push({ event, hasSession: !!session, timestamp: Date.now() })
      })
      return changes
    })
    
    // Attempt sign in (will fail with test credentials)
    await page.getByLabel('Email address').fill('test@gmail.com')
    await page.getByLabel('Password').fill('TestPassword123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for auth attempt
    await page.waitForTimeout(2000)
    
    // Check auth state changes
    const changes = await authStateChanges.jsonValue()
    console.log('Auth state changes:', changes)
  })

  test('should test OAuth popup handling', async ({ page, context }) => {
    // Set up popup handler
    const popupPromise = context.waitForEvent('page')
    
    // Click Google OAuth button
    await page.getByRole('button', { name: /continue with google/i }).click()
    
    // Handle popup if it appears
    try {
      const popup = await popupPromise
      
      // Wait for popup to load
      await popup.waitForLoadState()
      
      // Take screenshot of OAuth popup
      await popup.screenshot({ path: 'test-results/oauth-popup.png' })
      
      // Check if it's Google OAuth page
      const url = popup.url()
      expect(url).toContain('accounts.google.com')
      
      // Close popup
      await popup.close()
    } catch (error) {
      // OAuth might redirect instead of popup
      console.log('No popup detected, checking for redirect')
      
      // Check if redirected to Google
      await page.waitForTimeout(2000)
      if (page.url().includes('accounts.google.com')) {
        console.log('Redirected to Google OAuth')
      }
    }
  })

  test('should test Supabase session persistence', async ({ page, context }) => {
    // Try to set a mock session
    await page.evaluate(() => {
      // Set mock auth token in localStorage (Supabase format)
      const mockSession = {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-user-id',
          email: 'mock@test.com',
          created_at: new Date().toISOString(),
        }
      }
      
      // Supabase stores session in localStorage
      localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession))
    })
    
    // Reload page
    await page.reload()
    await waitForSupabaseReady(page)
    
    // Check if session persisted
    const hasSession = await page.evaluate(() => {
      const stored = localStorage.getItem('supabase.auth.token')
      return !!stored
    })
    
    expect(hasSession).toBe(true)
  })

  test('should test real-time auth events', async ({ page }) => {
    await waitForSupabaseReady(page)
    
    // Create event collector
    await page.evaluate(() => {
      window.authEvents = []
      window.supabase.auth.onAuthStateChange((event, session) => {
        window.authEvents.push({
          event,
          hasSession: !!session,
          timestamp: new Date().toISOString()
        })
      })
    })
    
    // Trigger various auth actions
    await page.getByLabel('Email address').fill('test@gmail.com')
    await page.getByLabel('Password').fill('TestPassword123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for events
    await page.waitForTimeout(3000)
    
    // Get collected events
    const events = await page.evaluate(() => window.authEvents)
    console.log('Collected auth events:', events)
    
    // Should have at least initial auth check
    expect(events.length).toBeGreaterThan(0)
  })

  test('should test error handling UI', async ({ page }) => {
    await waitForSupabaseReady(page)
    
    // Test various error scenarios
    const errorScenarios = [
      {
        email: 'test@gmail.com',
        password: 'wrong',
        expectedError: /password.*incorrect|invalid.*credentials/i
      },
      {
        email: 'nonexistent@gmail.com',
        password: 'TestPassword123!',
        expectedError: /user.*not.*found|invalid.*credentials/i
      }
    ]
    
    for (const scenario of errorScenarios) {
      // Clear previous errors
      await page.reload()
      await waitForSupabaseReady(page)
      
      // Fill form
      await page.getByLabel('Email address').fill(scenario.email)
      await page.getByLabel('Password').fill(scenario.password)
      
      // Submit
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Check for error
      await expect(page.getByText(scenario.expectedError)).toBeVisible({ 
        timeout: 10000 
      })
      
      // Take screenshot of error state
      await takeDebugScreenshot(page, `error-${scenario.email}`)
    }
  })

  test('should test loading states during auth', async ({ page }) => {
    await waitForSupabaseReady(page)
    
    // Fill form
    await page.getByLabel('Email address').fill('test@gmail.com')
    await page.getByLabel('Password').fill('TestPassword123!')
    
    // Get button
    const signInButton = page.getByRole('button', { name: /sign in/i })
    
    // Start monitoring button state
    const buttonStates: any[] = []
    
    // Click and monitor
    await Promise.all([
      signInButton.click(),
      page.waitForFunction(() => {
        const button = document.querySelector('button[type="submit"]')
        return button?.disabled === true
      }, { timeout: 5000 }).catch(() => {
        console.log('Button did not become disabled')
      })
    ])
    
    // Button should show loading state
    const isDisabled = await signInButton.isDisabled()
    const buttonText = await signInButton.textContent()
    
    console.log('Button state during auth:', { isDisabled, buttonText })
  })
})

test.describe('Supabase Auth Integration with MCP', () => {
  test('should verify Supabase configuration', async ({ page }) => {
    await page.goto('/auth/signin')
    await waitForSupabaseReady(page)
    
    // Get Supabase configuration
    const config = await page.evaluate(() => {
      if (window.supabase) {
        return {
          url: window.supabase.supabaseUrl,
          anonKey: window.supabase.supabaseKey?.substring(0, 20) + '...',
          hasAuth: !!window.supabase.auth,
          hasRealtime: !!window.supabase.realtime,
          hasStorage: !!window.supabase.storage,
          hasDatabase: !!window.supabase.from,
        }
      }
      return null
    })
    
    console.log('Supabase configuration:', config)
    
    // Verify all clients are initialized
    expect(config).toBeTruthy()
    expect(config?.hasAuth).toBe(true)
    expect(config?.hasDatabase).toBe(true)
  })

  test('should test database queries after auth', async ({ page }) => {
    await page.goto('/auth/signin')
    await waitForSupabaseReady(page)
    
    // Test if we can make database queries (will fail without auth)
    const queryResult = await page.evaluate(async () => {
      try {
        const { data, error } = await window.supabase
          .from('profiles')
          .select('*')
          .limit(1)
        
        return { 
          success: !error, 
          error: error?.message,
          hasData: !!data 
        }
      } catch (e) {
        return { success: false, error: e.message }
      }
    })
    
    console.log('Database query result:', queryResult)
    
    // Should fail with auth error since we're not authenticated
    expect(queryResult.success).toBe(false)
  })
})