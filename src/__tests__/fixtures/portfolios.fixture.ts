import { Database } from '@/types/database'
import { mockUsers } from './users.fixture'

type Portfolio = Database['public']['Tables']['portfolios']['Row']

export const mockPortfolios: Record<string, Portfolio> = {
  activePortfolio: {
    id: 'portfolio-123',
    user_id: mockUsers.testUser.id,
    name: 'My Active Portfolio',
    description: 'Main investment portfolio',
    total_value: 50000,
    total_invested: 45000,
    total_returns: 5000,
    risk_score: 6.5,
    esg_score: 7.8,
    is_active: true,
    settings: {
      currency: 'USD',
      rebalance_frequency: 'quarterly',
      notifications: {
        price_alerts: true,
        trade_confirmations: true,
        weekly_summary: true
      }
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  inactivePortfolio: {
    id: 'portfolio-456',
    user_id: mockUsers.testUser.id,
    name: 'Retirement Fund',
    description: 'Long-term retirement savings',
    total_value: 100000,
    total_invested: 80000,
    total_returns: 20000,
    risk_score: 4.2,
    esg_score: 8.5,
    is_active: false,
    settings: {
      currency: 'USD',
      rebalance_frequency: 'annually',
      notifications: {
        price_alerts: false,
        trade_confirmations: true,
        weekly_summary: false
      }
    },
    created_at: '2023-06-01T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  },
  emptyPortfolio: {
    id: 'portfolio-789',
    user_id: mockUsers.testUser.id,
    name: 'New Portfolio',
    description: null,
    total_value: 0,
    total_invested: 0,
    total_returns: 0,
    risk_score: null,
    esg_score: null,
    is_active: false,
    settings: {
      currency: 'USD',
      rebalance_frequency: 'monthly',
      notifications: {
        price_alerts: true,
        trade_confirmations: true,
        weekly_summary: true
      }
    },
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }
}

export const createMockPortfolio = (
  userId: string,
  overrides?: Partial<Portfolio>
): Portfolio => {
  return {
    ...mockPortfolios.activePortfolio,
    id: `portfolio-${Date.now()}`,
    user_id: userId,
    name: `Portfolio ${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

export const mockPortfolioWithHoldings = {
  ...mockPortfolios.activePortfolio,
  holdings: [
    {
      id: 'holding-123',
      portfolio_id: mockPortfolios.activePortfolio.id,
      asset_id: 'asset-aapl',
      quantity: 10,
      average_cost: 150,
      current_value: 1800,
      unrealized_gains: 300,
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    {
      id: 'holding-456',
      portfolio_id: mockPortfolios.activePortfolio.id,
      asset_id: 'asset-googl',
      quantity: 5,
      average_cost: 2800,
      current_value: 15000,
      unrealized_gains: 1000,
      created_at: '2024-01-07T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    }
  ]
}

export const mockPortfolioStats = {
  portfolio_id: mockPortfolios.activePortfolio.id,
  total_holdings: 15,
  asset_allocation: {
    stocks: 0.7,
    bonds: 0.2,
    cash: 0.1
  },
  sector_allocation: {
    technology: 0.4,
    healthcare: 0.2,
    finance: 0.15,
    consumer: 0.15,
    other: 0.1
  },
  performance: {
    daily_return: 0.012,
    weekly_return: 0.035,
    monthly_return: 0.078,
    yearly_return: 0.156,
    volatility: 0.18,
    sharpe_ratio: 1.45,
    beta: 0.95
  }
}