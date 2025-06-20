# Supabase Authentication Testing Guide

This guide provides comprehensive instructions for testing Supabase authentication with Playwright, incorporating best practices for 2024.

## Overview

The testing setup includes:
- API-based authentication for fast, reliable tests
- UI tests for critical user journeys
- RLS (Row Level Security) policy testing
- Test data isolation and cleanup
- Concurrent session handling
- OAuth flow testing

## Test Structure

```
e2e/
├── auth.setup.ts                    # Authentication setup for test reuse
├── supabase-auth.spec.ts           # UI-focused auth tests
├── supabase-auth-api.spec.ts       # API-based auth tests
├── supabase-auth-browser.spec.ts   # Browser automation tests
├── utils/
│   ├── supabase-test-helpers.ts   # Helper functions for Supabase
│   └── test-helpers.ts             # General test utilities
└── playwright.d.ts                 # TypeScript definitions
```

## Quick Start

### 1. Environment Setup

Create a `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Running Tests

```bash
# Run all auth tests
npm run test:e2e -- e2e/supabase-auth*.spec.ts

# Run with UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/supabase-auth-api.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed
```

## Key Testing Patterns

### 1. API-Based Authentication

The most efficient way to test authenticated flows is through API-based auth:

```typescript
import { createAuthenticatedContext } from './utils/supabase-test-helpers'

test('authenticated user can access dashboard', async ({ browser }) => {
  const context = await createAuthenticatedContext(
    browser,
    'test@gmail.com',
    'password123'
  )
  
  const page = await context.newPage()
  await page.goto('/dashboard')
  
  // Test authenticated functionality
  await expect(page).toHaveURL(/.*\/dashboard/)
})
```

### 2. Testing RLS Policies

Test Row Level Security by creating multiple users:

```typescript
test('users can only see their own data', async ({ browser }) => {
  // Create two user contexts
  const context1 = await createAuthenticatedContext(browser, user1Email, password)
  const context2 = await createAuthenticatedContext(browser, user2Email, password)
  
  // Test data isolation
  const page1 = await context1.newPage()
  const page2 = await context2.newPage()
  
  // Each user should only see their own portfolios
  await page1.goto('/portfolios')
  await page2.goto('/portfolios')
  
  // Verify RLS is working
})
```

### 3. OAuth Testing

For OAuth flows, test the initiation and callback handling:

```typescript
test('Google OAuth flow', async ({ page }) => {
  await page.goto('/auth/signin')
  
  // Monitor OAuth requests
  const oauthRequests = []
  page.on('request', request => {
    if (request.url().includes('oauth')) {
      oauthRequests.push(request.url())
    }
  })
  
  await page.getByRole('button', { name: /continue with google/i }).click()
  
  // Verify OAuth was initiated
  expect(oauthRequests.length).toBeGreaterThan(0)
})
```

## Best Practices

### 1. Use Real Email Domains

Supabase blocks disposable email domains like `example.com`. Use real domains:

```typescript
// ✅ Good
const email = 'test@gmail.com'

// ❌ Bad - will be rejected
const email = 'test@example.com'
```

### 2. Generate Unique Test Emails

Avoid conflicts by using timestamps:

```typescript
const email = `test_${Date.now()}@gmail.com`
```

### 3. Speed Up Tests with Auth State Reuse

Use Playwright's storage state feature:

```typescript
// auth.setup.ts
setup('authenticate', async ({ browser }) => {
  const context = await createAuthenticatedContext(browser, email, password)
  await context.storageState({ path: 'playwright/.auth/user.json' })
})

// In tests
test.use({ storageState: 'playwright/.auth/user.json' })
```

### 4. Handle Async Operations

Always wait for navigation and network idle:

```typescript
await page.goto('/dashboard')
await page.waitForLoadState('networkidle')
```

### 5. Test Error States

Don't forget to test error scenarios:

```typescript
test('shows error for invalid credentials', async ({ page }) => {
  await page.goto('/auth/signin')
  await fillAuthForm(page, 'wrong@email.com', 'wrongpassword')
  await page.getByRole('button', { name: /sign in/i }).click()
  
  await expect(page.getByText(/invalid credentials/i)).toBeVisible()
})
```

## Common Issues and Solutions

### Issue: Tests timeout on navigation

**Solution**: Ensure the dev server is running and accessible:

```bash
# In one terminal
npm run dev

# In another terminal
npm run test:e2e
```

### Issue: "Email address is invalid" error

**Solution**: Use real email domains (gmail.com, outlook.com) instead of example.com.

### Issue: Flaky OAuth tests

**Solution**: Use API-based auth for most tests, only test OAuth UI flow specifically when needed.

### Issue: Tests interfere with each other

**Solution**: Use unique test data for each test:

```typescript
const uniqueEmail = generateTestEmail('prefix')
```

## Advanced Testing

### Testing with Supawright

For advanced database state management, consider using [Supawright](https://github.com/isaacharrisholt/supawright):

```typescript
import { supawright } from 'supawright'

test.describe('with database isolation', () => {
  const test = supawright() // Automatic cleanup
  
  test('creates user data', async ({ page }) => {
    // Test with clean database state
  })
})
```

### Performance Testing

Monitor authentication performance:

```typescript
test('auth performance', async ({ page }) => {
  const startTime = Date.now()
  
  await authenticateUser(page, email, password)
  
  const authTime = Date.now() - startTime
  expect(authTime).toBeLessThan(3000) // Should auth in < 3s
})
```

### Security Testing

Test security headers and CSRF protection:

```typescript
test('includes security headers', async ({ page }) => {
  const response = await page.goto('/api/protected')
  
  expect(response.headers()['x-frame-options']).toBe('DENY')
  expect(response.headers()['x-content-type-options']).toBe('nosniff')
})
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        
      - name: Run tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tests

### Visual Debugging

```bash
# Run with UI mode
npx playwright test --ui

# Debug specific test
npx playwright test --debug e2e/supabase-auth.spec.ts
```

### Console Logs

Add console logs in tests:

```typescript
test('debug auth', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))
  
  await page.goto('/auth/signin')
  // Your test code
})
```

### Screenshots on Failure

Playwright automatically captures screenshots on failure. Find them in:
- `test-results/` directory
- `playwright-report/` after running tests

## Maintenance

### Regular Tasks

1. **Update test dependencies**: Keep Playwright and Supabase packages updated
2. **Clean test data**: Implement cleanup routines for test users
3. **Monitor test performance**: Track test execution times
4. **Review flaky tests**: Fix or refactor unstable tests

### Test Data Management

Consider implementing a test data cleanup endpoint:

```typescript
// api/test/cleanup.ts (protected route)
export async function POST(request: Request) {
  const { pattern } = await request.json()
  
  // Clean up test users matching pattern
  // Only enable in test environments!
}
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supawright Test Harness](https://github.com/isaacharrisholt/supawright)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)

## Summary

This testing setup provides:
- ✅ Fast, reliable authentication tests
- ✅ RLS policy validation
- ✅ OAuth flow testing
- ✅ Concurrent session handling
- ✅ Test isolation and cleanup
- ✅ TypeScript support
- ✅ CI/CD ready

Follow these patterns to maintain a robust test suite that catches authentication issues early and ensures your Supabase integration works correctly.