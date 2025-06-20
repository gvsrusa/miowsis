import { BrowserContext, APIRequestContext } from '@playwright/test'

// Supabase configuration from environment
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  expires_at?: number
  refresh_token: string
  user: {
    id: string
    email: string
    created_at: string
    [key: string]: any
  }
}

/**
 * Create a test user via Supabase Auth API
 */
export async function createTestUser(
  email: string,
  password: string,
  metadata: Record<string, any> = {}
): Promise<AuthResponse | null> {
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
        data: metadata,
        gotrue_meta_security: {}
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('User creation failed:', error)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Create user error:', error)
    return null
  }
}

/**
 * Authenticate user via Supabase Auth API
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResponse | null> {
  try {
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
      const error = await response.text()
      console.error('Authentication failed:', error)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

/**
 * Inject auth token into browser context
 */
export async function injectAuthToken(
  context: BrowserContext,
  authData: AuthResponse
): Promise<void> {
  await context.addInitScript((auth) => {
    // Determine the auth key based on Supabase URL
    const url = new URL(window.location.href)
    const projectRef = url.hostname.split('.')[0]
    const authKey = `sb-${projectRef}-auth-token`
    
    // Store auth data in localStorage
    localStorage.setItem(authKey, JSON.stringify({
      access_token: auth.access_token,
      token_type: auth.token_type,
      expires_in: auth.expires_in,
      expires_at: auth.expires_at || (Math.floor(Date.now() / 1000) + auth.expires_in),
      refresh_token: auth.refresh_token,
      user: auth.user
    }))
    
    // Also set for local development
    localStorage.setItem('supabase.auth.token', JSON.stringify(auth))
  }, authData)
}

/**
 * Create authenticated browser context
 */
export async function createAuthenticatedContext(
  browser: any,
  email: string,
  password: string
): Promise<BrowserContext | null> {
  const context = await browser.newContext()
  
  // Try to authenticate
  let authData = await authenticateUser(email, password)
  
  // If auth fails, try creating user first
  if (!authData) {
    const createResult = await createTestUser(email, password)
    if (createResult) {
      authData = await authenticateUser(email, password)
    }
  }
  
  if (!authData) {
    await context.close()
    return null
  }
  
  // Inject auth token
  await injectAuthToken(context, authData)
  
  return context
}

/**
 * Clear all auth data from page
 */
export async function clearAuth(page: any): Promise<void> {
  await page.context().clearCookies()
  await page.evaluate(() => {
    // Clear all localStorage items related to Supabase
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-') || key.includes('auth')
    )
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    // Clear sessionStorage
    sessionStorage.clear()
  })
}

/**
 * Generate unique test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `${prefix}_${timestamp}_${random}@gmail.com`
}

/**
 * Generate secure test password
 */
export function generateTestPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Wait for Supabase to be ready on page
 */
export async function waitForSupabase(page: any): Promise<boolean> {
  try {
    await page.waitForFunction(() => {
      return window.supabase !== undefined
    }, { timeout: 10000 })
    return true
  } catch {
    return false
  }
}

/**
 * Get current user from page context
 */
export async function getCurrentUser(page: any): Promise<any> {
  return await page.evaluate(async () => {
    if (!window.supabase) return null
    
    const { data: { user } } = await window.supabase.auth.getUser()
    return user
  })
}

/**
 * Sign out user via page context
 */
export async function signOut(page: any): Promise<void> {
  await page.evaluate(async () => {
    if (window.supabase) {
      await window.supabase.auth.signOut()
    }
  })
}

/**
 * Database query helper for testing
 */
export async function queryDatabase(
  query: string,
  authToken: string
): Promise<any> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      throw new Error(`Query failed: ${await response.text()}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Database query error:', error)
    return null
  }
}

/**
 * Clean up test data
 */
export async function cleanupTestUser(
  userId: string,
  authToken: string
): Promise<void> {
  // Note: This requires admin privileges or a server-side function
  // In practice, you might want to use Supawright or similar tools
  console.log(`Cleanup for user ${userId} - implement based on your setup`)
}

/**
 * Test RLS policies by trying operations with different users
 */
export async function testRLSPolicy(
  page: any,
  tableName: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  data?: any
): Promise<{ success: boolean; error?: string }> {
  return await page.evaluate(async ({ table, op, payload }) => {
    if (!window.supabase) {
      return { success: false, error: 'Supabase not initialized' }
    }

    try {
      let result
      switch (op) {
        case 'select':
          result = await window.supabase.from(table).select('*')
          break
        case 'insert':
          result = await window.supabase.from(table).insert(payload)
          break
        case 'update':
          result = await window.supabase.from(table).update(payload).eq('id', payload.id)
          break
        case 'delete':
          result = await window.supabase.from(table).delete().eq('id', payload.id)
          break
      }

      return {
        success: !result.error,
        error: result.error?.message
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }, { table: tableName, op: operation, payload: data })
}