import { test, expect } from '@playwright/test'

// Helper to set up authenticated session
async function setupAuthenticatedSession(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('auth-token', 'mock-token')
  })
  
  // Mock session API
  await page.route('**/api/auth/session', async route => {
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
  
  // Mock active portfolio
  await page.route('**/api/portfolios/active', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        portfolio: {
          id: 'portfolio-1',
          name: 'My Main Portfolio',
          total_value: 50000,
          cash_balance: 10000,
          is_active: true
        }
      })
    })
  })
}

test.describe('Trading Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page)
    await page.goto('/trade')
  })
  
  test('should display trade interface', async ({ page }) => {
    // Check main elements
    await expect(page.getByRole('heading', { name: /trade/i })).toBeVisible()
    await expect(page.getByPlaceholder(/search stocks/i)).toBeVisible()
    await expect(page.getByRole('tab', { name: /buy/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /sell/i })).toBeVisible()
    
    // Should show active portfolio info
    await expect(page.getByText('My Main Portfolio')).toBeVisible()
    await expect(page.getByText('Cash: $10,000')).toBeVisible()
  })
  
  test('should search for assets', async ({ page }) => {
    // Mock search API
    await page.route('**/api/assets/search?q=apple', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          results: [
            {
              id: 'asset-aapl',
              symbol: 'AAPL',
              name: 'Apple Inc.',
              type: 'stock',
              current_price: 180.50,
              day_change_percent: 1.26
            },
            {
              id: 'asset-aple',
              symbol: 'APLE',
              name: 'Apple Hospitality REIT',
              type: 'stock',
              current_price: 15.25,
              day_change_percent: -0.45
            }
          ]
        })
      })
    })
    
    // Type in search
    await page.getByPlaceholder(/search stocks/i).fill('apple')
    await page.waitForTimeout(500) // Debounce delay
    
    // Should show search results
    await expect(page.getByText('AAPL')).toBeVisible()
    await expect(page.getByText('Apple Inc.')).toBeVisible()
    await expect(page.getByText('$180.50')).toBeVisible()
    await expect(page.getByText('+1.26%')).toBeVisible()
    
    // Click on a result
    await page.getByText('AAPL').click()
    
    // Should select the asset
    await expect(page.getByTestId('selected-asset')).toContainText('AAPL')
    await expect(page.getByTestId('selected-asset')).toContainText('$180.50')
  })
  
  test('should execute buy order', async ({ page }) => {
    // Select an asset first
    await page.route('**/api/assets/asset-aapl', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          asset: {
            id: 'asset-aapl',
            symbol: 'AAPL',
            name: 'Apple Inc.',
            current_price: 180.50,
            market_cap: 2800000000000,
            pe_ratio: 29.5,
            dividend_yield: 0.44
          }
        })
      })
    })
    
    // Mock asset selection
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('asset-selected', {
        detail: {
          id: 'asset-aapl',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          current_price: 180.50
        }
      }))
    })
    
    // Fill in buy order
    await page.getByRole('tab', { name: /buy/i }).click()
    await page.getByPlaceholder(/quantity/i).fill('10')
    
    // Should show order preview
    await expect(page.getByText('Order Total: $1,805.00')).toBeVisible()
    await expect(page.getByText('Commission: $9.99')).toBeVisible()
    await expect(page.getByText('Total Cost: $1,814.99')).toBeVisible()
    
    // Mock transaction API
    await page.route('**/api/transactions', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          body: JSON.stringify({
            transaction: {
              id: 'txn-123',
              type: 'buy',
              asset_id: 'asset-aapl',
              quantity: 10,
              price: 180.50,
              total_amount: 1814.99,
              status: 'completed',
              executed_at: new Date().toISOString()
            }
          })
        })
      }
    })
    
    // Place order
    await page.getByRole('button', { name: /place buy order/i }).click()
    
    // Confirm order
    await page.getByRole('button', { name: /confirm order/i }).click()
    
    // Should show success
    await expect(page.getByText(/order executed successfully/i)).toBeVisible()
    await expect(page.getByText('10 shares of AAPL')).toBeVisible()
    await expect(page.getByText('at $180.50')).toBeVisible()
  })
  
  test('should execute sell order', async ({ page }) => {
    // Mock portfolio holdings
    await page.route('**/api/portfolios/portfolio-1/holdings', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          holdings: [
            {
              id: 'holding-1',
              asset: {
                id: 'asset-aapl',
                symbol: 'AAPL',
                name: 'Apple Inc.',
                current_price: 180.50
              },
              quantity: 20,
              average_cost: 150,
              current_value: 3610,
              unrealized_gains: 610
            }
          ]
        })
      })
    })
    
    // Switch to sell tab
    await page.getByRole('tab', { name: /sell/i }).click()
    
    // Should show holdings dropdown
    await expect(page.getByRole('combobox', { name: /select holding/i })).toBeVisible()
    
    // Select holding
    await page.getByRole('combobox', { name: /select holding/i }).selectOption('holding-1')
    
    // Should show holding info
    await expect(page.getByText('Available: 20 shares')).toBeVisible()
    await expect(page.getByText('Avg Cost: $150.00')).toBeVisible()
    
    // Enter sell quantity
    await page.getByPlaceholder(/quantity/i).fill('10')
    
    // Should show profit calculation
    await expect(page.getByText('Sale Proceeds: $1,805.00')).toBeVisible()
    await expect(page.getByText('Commission: $9.99')).toBeVisible()
    await expect(page.getByText('Net Proceeds: $1,795.01')).toBeVisible()
    await expect(page.getByText('Profit: $295.01')).toBeVisible()
    
    // Mock sell transaction
    await page.route('**/api/transactions', async route => {
      if (route.request().method() === 'POST') {
        const body = await route.request().json()
        if (body.type === 'sell') {
          await route.fulfill({
            status: 201,
            body: JSON.stringify({
              transaction: {
                id: 'txn-456',
                type: 'sell',
                asset_id: 'asset-aapl',
                quantity: 10,
                price: 180.50,
                total_amount: 1795.01,
                status: 'completed',
                executed_at: new Date().toISOString()
              }
            })
          })
        }
      }
    })
    
    // Place sell order
    await page.getByRole('button', { name: /place sell order/i }).click()
    
    // Confirm
    await page.getByRole('button', { name: /confirm order/i }).click()
    
    // Should show success
    await expect(page.getByText(/sell order executed/i)).toBeVisible()
    await expect(page.getByText('Profit: $295.01')).toBeVisible()
  })
  
  test('should validate order constraints', async ({ page }) => {
    // Select an asset
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('asset-selected', {
        detail: {
          id: 'asset-aapl',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          current_price: 180.50
        }
      }))
    })
    
    // Try to buy more than cash available
    await page.getByPlaceholder(/quantity/i).fill('100')
    
    // Should show error
    await expect(page.getByText(/insufficient funds/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /place buy order/i })).toBeDisabled()
    
    // Try negative quantity
    await page.getByPlaceholder(/quantity/i).fill('-5')
    await expect(page.getByText(/quantity must be positive/i)).toBeVisible()
    
    // Try zero quantity
    await page.getByPlaceholder(/quantity/i).fill('0')
    await expect(page.getByText(/quantity must be greater than 0/i)).toBeVisible()
    
    // Try fractional shares (if not supported)
    await page.getByPlaceholder(/quantity/i).fill('10.5')
    await expect(page.getByText(/fractional shares not supported/i)).toBeVisible()
  })
  
  test('should show order history', async ({ page }) => {
    // Navigate to orders tab
    await page.getByRole('tab', { name: /orders/i }).click()
    
    // Mock transactions API
    await page.route('**/api/transactions?portfolio_id=portfolio-1', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          transactions: [
            {
              id: 'txn-1',
              type: 'buy',
              asset: { symbol: 'AAPL', name: 'Apple Inc.' },
              quantity: 10,
              price: 180.50,
              total_amount: 1814.99,
              status: 'completed',
              executed_at: '2024-01-15T10:30:00Z'
            },
            {
              id: 'txn-2',
              type: 'sell',
              asset: { symbol: 'TSLA', name: 'Tesla Inc.' },
              quantity: 5,
              price: 250,
              total_amount: 1240.01,
              status: 'completed',
              executed_at: '2024-01-14T14:15:00Z'
            },
            {
              id: 'txn-3',
              type: 'buy',
              asset: { symbol: 'GOOGL', name: 'Alphabet Inc.' },
              quantity: 2,
              price: 3000,
              total_amount: 6009.99,
              status: 'pending',
              executed_at: null
            }
          ]
        })
      })
    })
    
    await page.reload()
    
    // Should display transaction history
    await expect(page.getByText('BUY')).toBeVisible()
    await expect(page.getByText('AAPL')).toBeVisible()
    await expect(page.getByText('10 shares @ $180.50')).toBeVisible()
    await expect(page.getByText('$1,814.99')).toBeVisible()
    
    // Should show pending order
    await expect(page.getByText('PENDING')).toBeVisible()
    await expect(page.getByText('GOOGL')).toBeVisible()
    
    // Filter by type
    await page.getByRole('combobox', { name: /filter by type/i }).selectOption('buy')
    await expect(page.getByText('TSLA')).not.toBeVisible()
    
    // Cancel pending order
    await page.getByRole('button', { name: /cancel order/i }).click()
    
    // Mock cancel API
    await page.route('**/api/transactions/txn-3/cancel', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          transaction: {
            id: 'txn-3',
            status: 'cancelled'
          }
        })
      })
    })
    
    // Confirm cancellation
    await page.getByRole('button', { name: /confirm cancel/i }).click()
    
    // Should show cancelled
    await expect(page.getByText('CANCELLED')).toBeVisible()
  })
  
  test('should display real-time price updates', async ({ page }) => {
    // Select an asset
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('asset-selected', {
        detail: {
          id: 'asset-aapl',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          current_price: 180.50
        }
      }))
    })
    
    // Mock WebSocket for real-time prices
    await page.evaluate(() => {
      // Simulate price updates
      let price = 180.50
      setInterval(() => {
        price += (Math.random() - 0.5) * 0.5 // Random price movement
        window.dispatchEvent(new CustomEvent('price-update', {
          detail: {
            symbol: 'AAPL',
            price: price,
            change: price - 180.50,
            changePercent: ((price - 180.50) / 180.50) * 100
          }
        }))
      }, 2000)
    })
    
    // Enter quantity
    await page.getByPlaceholder(/quantity/i).fill('10')
    
    // Wait for price update
    await page.waitForTimeout(3000)
    
    // Order total should update with new price
    const orderTotal = await page.getByTestId('order-total').textContent()
    expect(orderTotal).not.toBe('Order Total: $1,805.00') // Should have changed
  })
})