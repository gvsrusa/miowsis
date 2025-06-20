import { test as setup } from '@playwright/test'
import { 
  createAuthenticatedContext, 
  generateTestEmail, 
  generateTestPassword 
} from './utils/supabase-test-helpers'

// Path to store authenticated state
const authFile = 'playwright/.auth/user.json'

/**
 * Setup authenticated state that can be reused across tests
 * This dramatically speeds up tests by avoiding repeated login flows
 */
setup('authenticate test user', async ({ browser }) => {
  // Generate test credentials
  const email = generateTestEmail('setup')
  const password = generateTestPassword()
  
  console.log('Setting up test user:', email)
  
  // Create authenticated context
  const context = await createAuthenticatedContext(browser, email, password)
  
  if (!context) {
    throw new Error('Failed to create authenticated context')
  }
  
  // Navigate to a page to ensure auth is working
  const page = await context.newPage()
  await page.goto('/dashboard')
  
  // Wait for successful navigation
  await page.waitForURL(/.*\/dashboard/, { timeout: 10000 })
  
  // Save storage state
  await context.storageState({ path: authFile })
  
  console.log('Auth state saved to:', authFile)
  
  await context.close()
})

/**
 * Alternative setup for admin user
 */
setup('authenticate admin user', async ({ browser }) => {
  const adminAuthFile = 'playwright/.auth/admin.json'
  
  // Use predefined admin credentials from env or create new
  const email = process.env.TEST_ADMIN_EMAIL || generateTestEmail('admin')
  const password = process.env.TEST_ADMIN_PASSWORD || generateTestPassword()
  
  const context = await createAuthenticatedContext(browser, email, password)
  
  if (!context) {
    throw new Error('Failed to create admin context')
  }
  
  // Navigate to admin area to verify access
  const page = await context.newPage()
  await page.goto('/admin')
  
  // If redirected, admin access might not be configured
  const url = page.url()
  if (!url.includes('/admin')) {
    console.warn('Admin access not available for test user')
  }
  
  // Save admin storage state
  await context.storageState({ path: adminAuthFile })
  
  await context.close()
})

/**
 * Setup for testing with multiple user roles
 */
setup('setup user roles', async ({ browser }) => {
  const roles = ['user', 'premium', 'admin']
  
  for (const role of roles) {
    const email = generateTestEmail(role)
    const password = generateTestPassword()
    const authFile = `playwright/.auth/${role}.json`
    
    const context = await createAuthenticatedContext(browser, email, password)
    
    if (context) {
      // Save role-specific auth state
      await context.storageState({ path: authFile })
      await context.close()
      
      console.log(`${role} auth state saved to:`, authFile)
    }
  }
})

/**
 * Cleanup setup - runs after all tests
 */
setup('cleanup test data', async ({ request }) => {
  // This would typically call a cleanup endpoint or use admin SDK
  // For now, we'll just log
  console.log('Test cleanup - implement based on your setup')
  
  // Example cleanup via API:
  // await request.post('/api/test/cleanup', {
  //   data: { pattern: 'test_*@gmail.com' }
  // })
})