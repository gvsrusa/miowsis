import { Page, BrowserContext } from '@playwright/test'

export interface MockUser {
  id: string
  email: string
  name: string
  role?: 'user' | 'admin'
}

export interface MockPortfolio {
  id: string
  name: string
  total_value: number
  cash_balance: number
  is_active: boolean
}

/**
 * Set up authenticated session for tests
 */
export async function setupAuth(page: Page, user: MockUser = defaultUser) {
  // Add auth token to localStorage
  await page.addInitScript((user) => {
    window.localStorage.setItem('auth-token', 'mock-token')
    window.localStorage.setItem('user', JSON.stringify(user))
  }, user)
  
  // Mock session API
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        user,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
    })
  })
}

/**
 * Set up authenticated context with cookies
 */
export async function setupAuthContext(context: BrowserContext, user: MockUser = defaultUser) {
  await context.addCookies([{
    name: 'next-auth.session-token',
    value: 'mock-session-token',
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    expires: Date.now() / 1000 + 3600
  }])
  
  // Add init script for all pages in context
  await context.addInitScript((user) => {
    window.localStorage.setItem('user', JSON.stringify(user))
  }, user)
}

/**
 * Mock portfolio data
 */
export async function mockPortfolios(page: Page, portfolios: MockPortfolio[]) {
  await page.route('**/api/portfolios', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ portfolios })
      })
    }
  })
}

/**
 * Mock active portfolio
 */
export async function mockActivePortfolio(page: Page, portfolio: MockPortfolio) {
  await page.route('**/api/portfolios/active', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ portfolio })
    })
  })
}

/**
 * Mock asset search results
 */
export async function mockAssetSearch(page: Page, query: string, results: any[]) {
  await page.route(`**/api/assets/search?q=${query}`, async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ results })
    })
  })
}

/**
 * Mock transaction creation
 */
export async function mockCreateTransaction(page: Page, transaction: any) {
  await page.route('**/api/transactions', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        body: JSON.stringify({ transaction })
      })
    }
  })
}

/**
 * Wait for and dismiss toast notifications
 */
export async function dismissToast(page: Page) {
  const toast = page.getByRole('status')
  if (await toast.isVisible()) {
    await toast.getByRole('button', { name: /close/i }).click()
    await toast.waitFor({ state: 'hidden' })
  }
}

/**
 * Format currency for assertions
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

/**
 * Default test data
 */
export const defaultUser: MockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user'
}

export const defaultPortfolio: MockPortfolio = {
  id: 'portfolio-1',
  name: 'My Main Portfolio',
  total_value: 50000,
  cash_balance: 10000,
  is_active: true
}

export const mockAssets = {
  apple: {
    id: 'asset-aapl',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    current_price: 180.50,
    day_change_percent: 1.26
  },
  google: {
    id: 'asset-googl',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'stock',
    current_price: 3000.00,
    day_change_percent: 0.65
  },
  tesla: {
    id: 'asset-tsla',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    type: 'stock',
    current_price: 250.75,
    day_change_percent: 2.22
  }
}

/**
 * Fill form field with clear first
 */
export async function fillField(page: Page, selector: string, value: string) {
  const field = page.locator(selector)
  await field.clear()
  await field.fill(value)
}

/**
 * Check if element has error state
 */
export async function hasError(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector)
  const ariaInvalid = await element.getAttribute('aria-invalid')
  const hasErrorClass = await element.evaluate(el => 
    el.classList.contains('error') || 
    el.classList.contains('invalid') ||
    el.classList.contains('border-red-500')
  )
  return ariaInvalid === 'true' || hasErrorClass
}

/**
 * Wait for loading state to complete
 */
export async function waitForLoading(page: Page) {
  // Wait for any loading indicators to appear and disappear
  const loadingIndicators = [
    page.getByTestId('loading'),
    page.getByRole('progressbar'),
    page.locator('.loading'),
    page.locator('[data-loading="true"]')
  ]
  
  for (const indicator of loadingIndicators) {
    if (await indicator.isVisible()) {
      await indicator.waitFor({ state: 'hidden', timeout: 10000 })
    }
  }
}

/**
 * Mock API error response
 */
export async function mockApiError(
  page: Page, 
  url: string, 
  error: { message: string, code?: string },
  status: number = 400
) {
  await page.route(url, async route => {
    await route.fulfill({
      status,
      body: JSON.stringify({ error: error.message, code: error.code })
    })
  })
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({ 
    path: `tests/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  })
}