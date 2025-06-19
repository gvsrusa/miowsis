/**
 * Enhanced test helpers for comprehensive application flow testing
 */

import { Page, BrowserContext, expect } from '@playwright/test'
import { testCredentials, TestCredentials, testEnvironment } from '../test-data/credentials'

export class FlowTestHelper {
  constructor(private page: Page) {}

  /**
   * Complete user registration flow
   */
  async registerUser(credentials: TestCredentials) {
    await this.page.goto('/auth/signup')
    
    // Fill registration form
    await this.page.getByPlaceholder(/full name/i).fill(credentials.name)
    await this.page.getByPlaceholder(/email/i).fill(credentials.email)
    
    if (credentials.password) {
      await this.page.getByPlaceholder(/^password$/i).fill(credentials.password)
      await this.page.getByPlaceholder(/confirm password/i).fill(credentials.password)
    }
    
    // Accept terms
    await this.page.getByRole('checkbox', { name: /terms/i }).check()
    
    // Mock successful registration
    await this.mockRegistrationSuccess()
    
    // Submit form
    await this.page.getByRole('button', { name: /create account/i }).click()
    
    // Verify success
    await expect(this.page.getByText(/account created/i)).toBeVisible()
  }

  /**
   * Complete user login flow
   */
  async loginUser(credentials: TestCredentials) {
    await this.page.goto('/auth/signin')
    
    // Fill login form
    await this.page.getByPlaceholder(/email/i).fill(credentials.email)
    
    if (credentials.password) {
      await this.page.getByPlaceholder(/password/i).fill(credentials.password)
    }
    
    // Mock successful authentication
    await this.mockAuthSuccess(credentials)
    
    // Submit form
    await this.page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for redirect
    if (credentials.profile.onboarding_completed) {
      await expect(this.page).toHaveURL('/dashboard')
    } else {
      await expect(this.page).toHaveURL('/onboarding')
    }
  }

  /**
   * Complete onboarding flow
   */
  async completeOnboarding(credentials: TestCredentials) {
    await expect(this.page).toHaveURL('/onboarding')
    
    // Step 1: Personal Information
    await this.page.getByRole('button', { name: /continue/i }).click()
    
    // Step 2: Risk Assessment
    if (credentials.profile.risk_profile) {
      const { risk_tolerance, investment_horizon, investment_goals, experience_level } = credentials.profile.risk_profile
      
      // Select risk tolerance
      await this.page.getByRole('radio', { name: new RegExp(risk_tolerance, 'i') }).check()
      
      // Select investment horizon
      await this.page.getByRole('radio', { name: new RegExp(investment_horizon, 'i') }).check()
      
      // Select investment goals
      for (const goal of investment_goals) {
        await this.page.getByRole('checkbox', { name: new RegExp(goal, 'i') }).check()
      }
      
      // Select experience level
      await this.page.getByRole('radio', { name: new RegExp(experience_level, 'i') }).check()
      
      await this.page.getByRole('button', { name: /continue/i }).click()
    }
    
    // Step 3: KYC (mock completion)
    await this.mockKycCompletion(credentials.profile.kyc_status)
    await this.page.getByRole('button', { name: /verify identity/i }).click()
    
    // Complete onboarding
    await this.page.getByRole('button', { name: /finish/i }).click()
    
    // Should redirect to dashboard
    await expect(this.page).toHaveURL('/dashboard')
  }

  /**
   * Create a new portfolio
   */
  async createPortfolio(name: string, initialDeposit: number = 1000) {
    // Navigate to portfolios
    await this.page.getByRole('link', { name: /portfolios/i }).click()
    
    // Create new portfolio
    await this.page.getByRole('button', { name: /create portfolio/i }).click()
    
    // Fill portfolio details
    await this.page.getByPlaceholder(/portfolio name/i).fill(name)
    await this.page.getByPlaceholder(/initial deposit/i).fill(initialDeposit.toString())
    
    // Mock portfolio creation
    await this.mockPortfolioCreation(name, initialDeposit)
    
    // Submit
    await this.page.getByRole('button', { name: /create/i }).click()
    
    // Verify creation
    await expect(this.page.getByText(name)).toBeVisible()
  }

  /**
   * Execute a buy transaction
   */
  async executeBuyOrder(symbol: string, quantity: number, orderType: 'market' | 'limit' = 'market', limitPrice?: number) {
    // Navigate to trading
    await this.page.getByRole('link', { name: /market/i }).click()
    
    // Search for asset
    await this.page.getByPlaceholder(/search/i).fill(symbol)
    await this.page.getByText(symbol).first().click()
    
    // Open buy dialog
    await this.page.getByRole('button', { name: /buy/i }).click()
    
    // Fill order details
    await this.page.getByPlaceholder(/quantity/i).fill(quantity.toString())
    
    if (orderType === 'limit' && limitPrice) {
      await this.page.getByRole('radio', { name: /limit/i }).check()
      await this.page.getByPlaceholder(/price/i).fill(limitPrice.toString())
    }
    
    // Mock order execution
    await this.mockOrderExecution(symbol, quantity, orderType)
    
    // Submit order
    await this.page.getByRole('button', { name: /place order/i }).click()
    
    // Verify order confirmation
    await expect(this.page.getByText(/order placed/i)).toBeVisible()
  }

  /**
   * Execute a sell transaction
   */
  async executeSellOrder(symbol: string, quantity: number, orderType: 'market' | 'limit' | 'stop-loss' = 'market', price?: number) {
    // Navigate to portfolio
    await this.page.getByRole('link', { name: /portfolios/i }).click()
    
    // Find holding and sell
    await this.page.getByText(symbol).click()
    await this.page.getByRole('button', { name: /sell/i }).click()
    
    // Fill sell details
    await this.page.getByPlaceholder(/quantity/i).fill(quantity.toString())
    
    if (orderType !== 'market' && price) {
      await this.page.getByRole('radio', { name: new RegExp(orderType, 'i') }).check()
      await this.page.getByPlaceholder(/price/i).fill(price.toString())
    }
    
    // Mock sell execution
    await this.mockOrderExecution(symbol, quantity, orderType, 'sell')
    
    // Submit order
    await this.page.getByRole('button', { name: /place order/i }).click()
    
    // Verify order confirmation
    await expect(this.page.getByText(/order placed/i)).toBeVisible()
  }

  /**
   * Navigate through dashboard sections
   */
  async navigateDashboard() {
    await expect(this.page).toHaveURL('/dashboard')
    
    // Check main dashboard elements
    await expect(this.page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(this.page.getByText(/total value/i)).toBeVisible()
    await expect(this.page.getByText(/today's change/i)).toBeVisible()
    
    // Navigate to different sections
    const sections = [
      { name: 'portfolios', url: '/portfolios' },
      { name: 'market', url: '/market' },
      { name: 'achievements', url: '/achievements' },
      { name: 'ai assistant', url: '/ai-assistant' },
      { name: 'settings', url: '/settings' }
    ]
    
    for (const section of sections) {
      await this.page.getByRole('link', { name: new RegExp(section.name, 'i') }).click()
      await expect(this.page).toHaveURL(section.url)
      
      // Wait for page to load
      await this.waitForPageLoad()
      
      // Go back to dashboard
      await this.page.getByRole('link', { name: /dashboard/i }).click()
      await expect(this.page).toHaveURL('/dashboard')
    }
  }

  /**
   * Check and interact with achievements
   */
  async checkAchievements() {
    await this.page.getByRole('link', { name: /achievements/i }).click()
    
    // Mock achievements data
    await this.mockAchievements()
    
    // Check for achievement elements
    await expect(this.page.getByText(/achievements/i)).toBeVisible()
    await expect(this.page.getByText(/points/i)).toBeVisible()
    
    // Check for unlocked achievements
    const achievements = this.page.locator('[data-testid="achievement-card"]')
    const count = await achievements.count()
    
    if (count > 0) {
      await expect(achievements.first()).toBeVisible()
    }
  }

  /**
   * Test AI assistant functionality
   */
  async testAiAssistant() {
    await this.page.getByRole('link', { name: /ai assistant/i }).click()
    
    // Mock AI responses
    await this.mockAiAssistant()
    
    // Test basic interaction
    const chatInput = this.page.getByPlaceholder(/ask me anything/i)
    await chatInput.fill('What should I invest in?')
    await this.page.getByRole('button', { name: /send/i }).click()
    
    // Wait for AI response
    await expect(this.page.getByText(/based on your risk profile/i)).toBeVisible({ timeout: 10000 })
  }

  /**
   * Update user settings
   */
  async updateSettings() {
    await this.page.getByRole('link', { name: /settings/i }).click()
    
    // Update profile settings
    await this.page.getByRole('tab', { name: /profile/i }).click()
    await this.page.getByPlaceholder(/full name/i).fill('Updated Test User')
    
    // Update preferences
    await this.page.getByRole('tab', { name: /preferences/i }).click()
    await this.page.getByRole('switch', { name: /email notifications/i }).click()
    
    // Update risk profile
    await this.page.getByRole('tab', { name: /risk profile/i }).click()
    await this.page.getByRole('radio', { name: /aggressive/i }).check()
    
    // Save changes
    await this.page.getByRole('button', { name: /save changes/i }).click()
    
    // Verify success
    await expect(this.page.getByText(/settings updated/i)).toBeVisible()
  }

  /**
   * Test portfolio performance and analytics
   */
  async reviewPortfolioPerformance() {
    await this.page.getByRole('link', { name: /portfolios/i }).click()
    
    // Select active portfolio
    await this.page.getByText(/my main portfolio/i).click()
    
    // Check performance metrics
    await expect(this.page.getByText(/total return/i)).toBeVisible()
    await expect(this.page.getByText(/annual return/i)).toBeVisible()
    await expect(this.page.getByText(/risk score/i)).toBeVisible()
    
    // Check charts and visualizations
    await expect(this.page.locator('canvas, svg').first()).toBeVisible()
    
    // Test different time periods
    const periods = ['1D', '1W', '1M', '3M', '1Y', 'ALL']
    for (const period of periods) {
      await this.page.getByRole('button', { name: period }).click()
      await this.waitForPageLoad()
    }
  }

  /**
   * Test mobile responsiveness
   */
  async testMobileExperience() {
    // Set mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 })
    
    // Test mobile navigation
    await this.page.getByRole('button', { name: /menu/i }).click()
    await expect(this.page.getByRole('navigation')).toBeVisible()
    
    // Test swipeable elements
    const portfolioCard = this.page.locator('[data-testid="swipeable-portfolio-card"]').first()
    if (await portfolioCard.isVisible()) {
      await portfolioCard.hover()
      await this.page.mouse.down()
      await this.page.mouse.move(100, 0)
      await this.page.mouse.up()
    }
    
    // Reset viewport
    await this.page.setViewportSize({ width: 1280, height: 720 })
  }

  // Private helper methods for mocking API responses

  private async mockRegistrationSuccess() {
    await this.page.route('**/api/auth/signup', async route => {
      await route.fulfill({
        status: 201,
        body: JSON.stringify({ success: true, message: 'Account created successfully' })
      })
    })
  }

  private async mockAuthSuccess(credentials: TestCredentials) {
    await this.page.route('**/api/auth/**', async route => {
      const url = route.request().url()
      
      if (url.includes('callback') || url.includes('session')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            user: {
              id: `user-${credentials.email.split('@')[0]}`,
              email: credentials.email,
              name: credentials.name,
              role: credentials.role
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
        })
      }
    })
  }

  private async mockKycCompletion(status: 'pending' | 'verified' | 'rejected') {
    await this.page.route('**/api/kyc/**', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ status, message: `KYC ${status}` })
      })
    })
  }

  private async mockPortfolioCreation(name: string, value: number) {
    await this.page.route('**/api/portfolios', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          body: JSON.stringify({
            id: `portfolio-${Date.now()}`,
            name,
            total_value: value,
            created_at: new Date().toISOString()
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            portfolios: [
              {
                id: `portfolio-${Date.now()}`,
                name,
                total_value: value,
                is_active: true
              }
            ]
          })
        })
      }
    })
  }

  private async mockOrderExecution(symbol: string, quantity: number, orderType: string, side: 'buy' | 'sell' = 'buy') {
    await this.page.route('**/api/transactions', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          body: JSON.stringify({
            id: `txn-${Date.now()}`,
            asset_symbol: symbol,
            quantity,
            type: side,
            order_type: orderType,
            status: 'completed',
            created_at: new Date().toISOString()
          })
        })
      }
    })
  }

  private async mockAchievements() {
    await this.page.route('**/api/achievements', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          achievements: [
            {
              id: 'first-investment',
              name: 'First Investment',
              description: 'Made your first investment',
              unlocked: true,
              points: 100
            },
            {
              id: 'portfolio-builder',
              name: 'Portfolio Builder',
              description: 'Created your first portfolio',
              unlocked: true,
              points: 200
            }
          ],
          totalPoints: 300
        })
      })
    })
  }

  private async mockAiAssistant() {
    await this.page.route('**/api/ai/chat', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          response: 'Based on your risk profile and investment goals, I recommend a diversified portfolio with 60% stocks and 40% bonds. Consider index funds like SPY and BND for broad market exposure.',
          suggestions: ['SPY', 'BND', 'VTI']
        })
      })
    })
  }

  private async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForTimeout(1000) // Additional buffer for animations
  }
}

// Export convenience functions for direct use
export async function createFlowHelper(page: Page): Promise<FlowTestHelper> {
  return new FlowTestHelper(page)
}

export async function runFullUserFlow(page: Page, credentials: TestCredentials) {
  const helper = new FlowTestHelper(page)
  
  // Complete registration and onboarding if new user
  if (!credentials.profile.onboarding_completed) {
    await helper.registerUser(credentials)
    await helper.completeOnboarding(credentials)
  } else {
    await helper.loginUser(credentials)
  }
  
  // Navigate through main sections
  await helper.navigateDashboard()
  
  // Create portfolio and execute trades
  await helper.createPortfolio('Test Portfolio', 5000)
  await helper.executeBuyOrder('AAPL', 10)
  
  // Check achievements and AI assistant
  await helper.checkAchievements()
  await helper.testAiAssistant()
  
  // Review performance
  await helper.reviewPortfolioPerformance()
  
  // Update settings
  await helper.updateSettings()
  
  // Test mobile experience
  await helper.testMobileExperience()
}