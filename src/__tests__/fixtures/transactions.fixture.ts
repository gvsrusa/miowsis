import { mockPortfolios } from './portfolios.fixture'
import { mockUsers } from './users.fixture'

export interface Transaction {
  id: string
  user_id: string
  portfolio_id: string
  asset_id: string
  type: 'buy' | 'sell' | 'dividend' | 'fee'
  quantity: number
  price: number
  total_amount: number
  fees: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  notes: string | null
  executed_at: string | null
  created_at: string
  updated_at: string
}

export const mockTransactions: Record<string, Transaction> = {
  buyTransaction: {
    id: 'txn-buy-123',
    user_id: mockUsers.testUser.id,
    portfolio_id: mockPortfolios.activePortfolio.id,
    asset_id: 'asset-aapl',
    type: 'buy',
    quantity: 10,
    price: 150,
    total_amount: 1500,
    fees: 9.99,
    currency: 'USD',
    status: 'completed',
    notes: 'Initial purchase of AAPL',
    executed_at: '2024-01-05T10:30:00Z',
    created_at: '2024-01-05T10:29:00Z',
    updated_at: '2024-01-05T10:30:00Z'
  },
  sellTransaction: {
    id: 'txn-sell-456',
    user_id: mockUsers.testUser.id,
    portfolio_id: mockPortfolios.activePortfolio.id,
    asset_id: 'asset-tsla',
    type: 'sell',
    quantity: 5,
    price: 250,
    total_amount: 1250,
    fees: 9.99,
    currency: 'USD',
    status: 'completed',
    notes: 'Taking profits on TSLA',
    executed_at: '2024-01-10T14:15:00Z',
    created_at: '2024-01-10T14:14:00Z',
    updated_at: '2024-01-10T14:15:00Z'
  },
  pendingTransaction: {
    id: 'txn-pending-789',
    user_id: mockUsers.testUser.id,
    portfolio_id: mockPortfolios.activePortfolio.id,
    asset_id: 'asset-googl',
    type: 'buy',
    quantity: 2,
    price: 3000,
    total_amount: 6000,
    fees: 0,
    currency: 'USD',
    status: 'pending',
    notes: 'Limit order for GOOGL',
    executed_at: null,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  dividendTransaction: {
    id: 'txn-div-111',
    user_id: mockUsers.testUser.id,
    portfolio_id: mockPortfolios.activePortfolio.id,
    asset_id: 'asset-aapl',
    type: 'dividend',
    quantity: 0,
    price: 0,
    total_amount: 22.50,
    fees: 0,
    currency: 'USD',
    status: 'completed',
    notes: 'Q4 2023 dividend payment',
    executed_at: '2024-01-12T00:00:00Z',
    created_at: '2024-01-12T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z'
  },
  failedTransaction: {
    id: 'txn-failed-222',
    user_id: mockUsers.testUser.id,
    portfolio_id: mockPortfolios.activePortfolio.id,
    asset_id: 'asset-amzn',
    type: 'buy',
    quantity: 50,
    price: 170,
    total_amount: 8500,
    fees: 0,
    currency: 'USD',
    status: 'failed',
    notes: 'Insufficient funds',
    executed_at: null,
    created_at: '2024-01-14T11:30:00Z',
    updated_at: '2024-01-14T11:31:00Z'
  }
}

export const createMockTransaction = (
  userId: string,
  portfolioId: string,
  overrides?: Partial<Transaction>
): Transaction => {
  return {
    ...mockTransactions.buyTransaction,
    id: `txn-${Date.now()}`,
    user_id: userId,
    portfolio_id: portfolioId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

export const mockTransactionHistory = [
  mockTransactions.buyTransaction,
  mockTransactions.sellTransaction,
  mockTransactions.dividendTransaction,
  mockTransactions.pendingTransaction,
  mockTransactions.failedTransaction
]

export const mockTransactionSummary = {
  total_transactions: 5,
  completed_transactions: 3,
  pending_transactions: 1,
  failed_transactions: 1,
  total_invested: 8750,
  total_sold: 1250,
  total_dividends: 22.50,
  total_fees: 19.98,
  net_invested: 7522.50
}