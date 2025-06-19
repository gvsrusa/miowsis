# MIOwSIS Testing Quick Reference

## Common Test Patterns

### Testing a Service Method

```typescript
import { ServiceName } from './service-name'
import { createClient } from '@/lib/supabase/server'
import { createMockSupabaseClient } from '@/__tests__/fixtures'

jest.mock('@/lib/supabase/server')

describe('ServiceName', () => {
  const mockSupabase = createMockSupabaseClient()
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })
  
  it('should perform expected action', async () => {
    // Arrange
    mockSupabase._chain.single.mockResolvedValueOnce({
      data: mockData,
      error: null
    })
    
    // Act
    const result = await ServiceName.method(params)
    
    // Assert
    expect(result).toEqual(expectedResult)
    expect(mockSupabase.from).toHaveBeenCalledWith('table_name')
  })
})
```

### Testing an API Route

```typescript
import { GET, POST } from './route'
import { getServerSession } from 'next-auth'
import { mockSession } from '@/__tests__/fixtures'

jest.mock('next-auth')

describe('API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('should handle authenticated request', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    
    const response = await GET()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('expectedField')
  })
})
```

### Testing E2E Flows

```typescript
import { test, expect } from '@playwright/test'
import { setupAuth, mockPortfolios } from './utils/test-helpers'

test.describe('Feature Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page)
    await page.goto('/feature-page')
  })
  
  test('should complete user action', async ({ page }) => {
    // Arrange
    await mockPortfolios(page, [mockPortfolio])
    
    // Act
    await page.getByRole('button', { name: /action/i }).click()
    
    // Assert
    await expect(page.getByText(/success/i)).toBeVisible()
  })
})
```

## Common Assertions

### Jest Assertions

```typescript
// Basic assertions
expect(value).toBe(expected)
expect(value).toEqual(expected)
expect(value).toBeDefined()
expect(value).toBeNull()
expect(value).toBeTruthy()
expect(value).toBeFalsy()

// Numbers
expect(value).toBeGreaterThan(number)
expect(value).toBeLessThanOrEqual(number)
expect(value).toBeCloseTo(number, decimals)

// Strings
expect(string).toContain(substring)
expect(string).toMatch(/pattern/)

// Arrays/Objects
expect(array).toHaveLength(number)
expect(array).toContain(item)
expect(object).toHaveProperty('key', value)
expect(object).toMatchObject(partial)

// Functions
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith(args)
expect(fn).toHaveBeenCalledTimes(number)
expect(fn).toThrow(error)

// Promises
await expect(promise).resolves.toBe(value)
await expect(promise).rejects.toThrow(error)
```

### Playwright Assertions

```typescript
// Visibility
await expect(page.getByText('text')).toBeVisible()
await expect(element).toBeHidden()
await expect(element).toBeEnabled()
await expect(element).toBeDisabled()

// Content
await expect(page).toHaveTitle('Title')
await expect(page).toHaveURL('/path')
await expect(element).toHaveText('text')
await expect(element).toContainText('partial')
await expect(element).toHaveValue('value')

// State
await expect(checkbox).toBeChecked()
await expect(element).toHaveClass('class-name')
await expect(element).toHaveAttribute('attr', 'value')

// Count
await expect(page.getByRole('listitem')).toHaveCount(5)
```

## Mock Patterns

### Mocking Supabase Queries

```typescript
// Single result
mockSupabase._chain.single.mockResolvedValueOnce({
  data: mockData,
  error: null
})

// Multiple results
mockSupabase._chain.order.mockResolvedValueOnce({
  data: [mockItem1, mockItem2],
  error: null
})

// Error response
mockSupabase._chain.single.mockResolvedValueOnce({
  data: null,
  error: new Error('Not found')
})

// Chained queries
mockSupabase.from.mockImplementation((table) => {
  if (table === 'users') {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: userData })
    }
  }
  return mockSupabase._chain
})
```

### Mocking API Responses (Playwright)

```typescript
// Success response
await page.route('**/api/endpoint', async route => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'value' })
  })
})

// Error response
await page.route('**/api/endpoint', async route => {
  await route.fulfill({
    status: 400,
    body: JSON.stringify({ error: 'Bad request' })
  })
})

// Conditional mocking
await page.route('**/api/endpoint', async route => {
  const method = route.request().method()
  if (method === 'POST') {
    // Handle POST
  } else {
    // Handle GET
  }
})
```

## Test Data Generators

```typescript
// Generate unique IDs
const id = `test-${Date.now()}`

// Generate test user
const user = createMockUser({
  email: `test-${Date.now()}@example.com`,
  role: 'admin'
})

// Generate portfolio with holdings
const portfolio = {
  ...createMockPortfolio(userId),
  holdings: [
    { asset_id: 'asset-1', quantity: 10 },
    { asset_id: 'asset-2', quantity: 5 }
  ]
}
```

## Debugging Tests

### Jest
```bash
# Run single test file
npm test -- portfolio.service.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create"

# Run with verbose output
npm test -- --verbose

# Debug in VS Code
# Add breakpoint and use "Debug Jest Tests" launch config
```

### Playwright
```bash
# Run in headed mode
npx playwright test --headed

# Run single test
npx playwright test auth.spec.ts

# Debug mode
npx playwright test --debug

# Generate code
npx playwright codegen localhost:3000
```

## Performance Tips

1. **Use `beforeAll` for expensive setup**
```typescript
let expensiveResource
beforeAll(async () => {
  expensiveResource = await createExpensiveResource()
})
```

2. **Batch API mocks**
```typescript
await page.route('**/api/**', async route => {
  const url = route.request().url()
  if (url.includes('portfolios')) {
    // Handle portfolios
  } else if (url.includes('assets')) {
    // Handle assets
  }
})
```

3. **Reuse test data**
```typescript
const testData = {
  users: [user1, user2],
  portfolios: [portfolio1, portfolio2]
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((data) => {
    window.testData = data
  }, testData)
})
```

4. **Parallel test execution**
```typescript
test.describe.parallel('Independent tests', () => {
  test('test 1', async ({ page }) => {})
  test('test 2', async ({ page }) => {})
})
```