import { test, expect } from '@playwright/test'

// Helper to set up authenticated session
async function setupAuthenticatedSession(page: any) {
  await page.addInitScript(() => {
    window.localStorage.setItem('auth-token', 'mock-token')
  })
  
  // Mock session API
  await page.route('**/api/auth/session', async (route: any) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
    })
  })
}

test.describe('Portfolio Management', () => {
  test.beforeEach(async ({ page }: { page: any }) => {
    await setupAuthenticatedSession(page)
    await page.goto('/portfolios')
  })
  
  test('should display portfolio list', async ({ page }) => {
    // Mock portfolio list API
    await page.route('**/api/portfolios', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          portfolios: [
            {
              id: 'portfolio-1',
              name: 'My Main Portfolio',
              total_value: 50000,
              total_returns: 5000,
              is_active: true,
              holdings_count: 10,
              last_transaction_at: '2024-01-15'
            },
            {
              id: 'portfolio-2',
              name: 'Retirement Fund',
              total_value: 100000,
              total_returns: 20000,
              is_active: false,
              holdings_count: 15,
              last_transaction_at: '2024-01-10'
            }
          ]
        })
      })
    })
    
    await page.reload()
    
    // Check portfolio cards are displayed
    await expect(page.getByText('My Main Portfolio')).toBeVisible()
    await expect(page.getByText('Retirement Fund')).toBeVisible()
    await expect(page.getByText('$50,000')).toBeVisible()
    await expect(page.getByText('$100,000')).toBeVisible()
  })
  
  test('should create new portfolio', async ({ page }) => {
    // Click create button
    await page.getByRole('button', { name: /create portfolio/i }).click()
    
    // Fill in form
    await page.getByPlaceholder(/portfolio name/i).fill('Growth Portfolio')
    await page.getByRole('combobox', { name: /currency/i }).selectOption('USD')
    
    // Mock create API
    await page.route('**/api/portfolios', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          body: JSON.stringify({
            portfolio: {
              id: 'portfolio-new',
              name: 'Growth Portfolio',
              currency: 'USD',
              total_value: 0,
              total_returns: 0,
              is_active: false
            }
          })
        })
      }
    })
    
    // Submit form
    await page.getByRole('button', { name: /create/i }).click()
    
    // Should show success message
    await expect(page.getByText(/portfolio created successfully/i)).toBeVisible()
    
    // Should show new portfolio in list
    await expect(page.getByText('Growth Portfolio')).toBeVisible()
  })
  
  test('should handle portfolio limit error', async ({ page }) => {
    // Mock create API with limit error
    await page.route('**/api/portfolios', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({
            error: 'Maximum portfolio limit reached'
          })
        })
      }
    })
    
    // Try to create portfolio
    await page.getByRole('button', { name: /create portfolio/i }).click()
    await page.getByPlaceholder(/portfolio name/i).fill('Another Portfolio')
    await page.getByRole('button', { name: /create/i }).click()
    
    // Should show error message
    await expect(page.getByText(/maximum portfolio limit reached/i)).toBeVisible()
  })
  
  test('should view portfolio details', async ({ page }) => {
    // Mock portfolio details API
    await page.route('**/api/portfolios/portfolio-1', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          portfolio: {
            id: 'portfolio-1',
            name: 'My Main Portfolio',
            total_value: 50000,
            total_returns: 5000,
            holdings: [
              {
                asset: { symbol: 'AAPL', name: 'Apple Inc.' },
                quantity: 10,
                current_value: 1800,
                unrealized_gains: 300
              },
              {
                asset: { symbol: 'GOOGL', name: 'Alphabet Inc.' },
                quantity: 5,
                current_value: 15000,
                unrealized_gains: 1000
              }
            ]
          }
        })
      })
    })
    
    // Click on portfolio card
    await page.getByText('My Main Portfolio').click()
    
    // Should navigate to details page
    await expect(page).toHaveURL('/portfolios/portfolio-1')
    
    // Should display holdings
    await expect(page.getByText('AAPL')).toBeVisible()
    await expect(page.getByText('Apple Inc.')).toBeVisible()
    await expect(page.getByText('10 shares')).toBeVisible()
    await expect(page.getByText('$1,800')).toBeVisible()
  })
  
  test('should update portfolio settings', async ({ page }) => {
    // Navigate to portfolio details
    await page.goto('/portfolios/portfolio-1')
    
    // Click settings button
    await page.getByRole('button', { name: /settings/i }).click()
    
    // Update name
    await page.getByPlaceholder(/portfolio name/i).fill('Updated Portfolio Name')
    
    // Toggle active status
    await page.getByRole('switch', { name: /active portfolio/i }).click()
    
    // Mock update API
    await page.route('**/api/portfolios/portfolio-1', async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            portfolio: {
              id: 'portfolio-1',
              name: 'Updated Portfolio Name',
              is_active: true
            }
          })
        })
      }
    })
    
    // Save changes
    await page.getByRole('button', { name: /save changes/i }).click()
    
    // Should show success message
    await expect(page.getByText(/portfolio updated successfully/i)).toBeVisible()
    
    // Should reflect changes
    await expect(page.getByRole('heading', { name: 'Updated Portfolio Name' })).toBeVisible()
  })
  
  test('should delete empty portfolio', async ({ page }) => {
    // Navigate to empty portfolio
    await page.goto('/portfolios/portfolio-empty')
    
    // Mock portfolio without holdings
    await page.route('**/api/portfolios/portfolio-empty', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            portfolio: {
              id: 'portfolio-empty',
              name: 'Empty Portfolio',
              total_value: 0,
              holdings: []
            }
          })
        })
      }
    })
    
    // Click delete button
    await page.getByRole('button', { name: /delete portfolio/i }).click()
    
    // Confirm deletion
    await page.getByRole('button', { name: /confirm delete/i }).click()
    
    // Mock delete API
    await page.route('**/api/portfolios/portfolio-empty', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true })
        })
      }
    })
    
    // Should redirect to portfolio list
    await expect(page).toHaveURL('/portfolios')
    await expect(page.getByText(/portfolio deleted successfully/i)).toBeVisible()
  })
  
  test('should prevent deletion of portfolio with holdings', async ({ page }) => {
    // Navigate to portfolio with holdings
    await page.goto('/portfolios/portfolio-1')
    
    // Mock delete API with error
    await page.route('**/api/portfolios/portfolio-1', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({
            error: 'Cannot delete portfolio with holdings'
          })
        })
      }
    })
    
    // Try to delete
    await page.getByRole('button', { name: /delete portfolio/i }).click()
    await page.getByRole('button', { name: /confirm delete/i }).click()
    
    // Should show error
    await expect(page.getByText(/cannot delete portfolio with holdings/i)).toBeVisible()
  })
  
  test('should display portfolio performance chart', async ({ page }) => {
    // Navigate to portfolio details
    await page.goto('/portfolios/portfolio-1')
    
    // Check for performance chart
    await expect(page.getByTestId('performance-chart')).toBeVisible()
    
    // Check time period selector
    await expect(page.getByRole('button', { name: /1d/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /1w/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /1m/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /1y/i })).toBeVisible()
    
    // Switch time period
    await page.getByRole('button', { name: /1m/i }).click()
    
    // Chart should update (check for loading state)
    await expect(page.getByTestId('chart-loading')).toBeVisible()
    await expect(page.getByTestId('chart-loading')).not.toBeVisible({ timeout: 5000 })
  })
})