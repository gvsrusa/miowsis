import { AutomationService } from './automation.service'
import { TransactionService } from './transaction.service'
import { PortfolioService } from '../portfolio/portfolio.service'
import { createClient } from '@/lib/supabase/server'
import { createMockSupabaseClient } from '@/__tests__/fixtures'

jest.mock('@/lib/supabase/server')
jest.mock('./transaction.service')
jest.mock('../portfolio/portfolio.service')

describe('AutomationService', () => {
  const mockSupabase = createMockSupabaseClient()
  const mockUserId = 'user-123'
  const mockPortfolioId = 'portfolio-123'
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
    
    // Add missing methods to mockSupabase._chain
    mockSupabase._chain.lte = jest.fn().mockReturnThis()
    mockSupabase._chain.in = jest.fn().mockReturnThis()
    mockSupabase._chain.gte = jest.fn().mockReturnThis()
    
    // Mock Date.now() for consistent testing
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15T10:00:00Z'))
  })
  
  afterEach(() => {
    jest.useRealTimers()
  })
  
  describe('createAutomationRule', () => {
    it('should create a scheduled investment rule', async () => {
      const mockRule = {
        id: 'rule-123',
        user_id: mockUserId,
        portfolio_id: mockPortfolioId,
        name: 'Weekly DCA',
        is_active: true,
        investment_amount: 100,
        frequency: 'weekly' as const,
        trigger_type: 'schedule' as const,
        allocation_strategy: 'equal_weight' as const,
        asset_allocation: {
          'asset-aapl': 50,
          'asset-googl': 50
        },
        next_execution: '2024-01-22T10:00:00.000Z',
        total_invested: 0,
        execution_count: 0,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }
      
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockRule,
        error: null
      })
      
      const result = await AutomationService.createAutomationRule(mockUserId, {
        portfolio_id: mockPortfolioId,
        name: 'Weekly DCA',
        is_active: true,
        investment_amount: 100,
        frequency: 'weekly',
        trigger_type: 'schedule',
        allocation_strategy: 'equal_weight',
        asset_allocation: {
          'asset-aapl': 50,
          'asset-googl': 50
        },
        next_execution: ''
      })
      
      expect(result).toEqual(mockRule)
      expect(mockSupabase._chain.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        portfolio_id: mockPortfolioId,
        name: 'Weekly DCA',
        is_active: true,
        investment_amount: 100,
        frequency: 'weekly',
        trigger_type: 'schedule',
        allocation_strategy: 'equal_weight',
        asset_allocation: {
          'asset-aapl': 50,
          'asset-googl': 50
        },
        next_execution: '2024-01-22T10:00:00.000Z',
        total_invested: 0,
        execution_count: 0
      })
    })
    
    it('should create a round-up rule', async () => {
      const mockRule = {
        id: 'rule-456',
        user_id: mockUserId,
        portfolio_id: mockPortfolioId,
        name: 'Round-up Investing',
        is_active: true,
        investment_amount: 0,
        frequency: 'daily' as const,
        trigger_type: 'round_up' as const,
        allocation_strategy: 'equal_weight' as const,
        asset_allocation: {
          'asset-voo': 100
        },
        round_up_multiplier: 2,
        next_execution: '2024-01-15T10:00:00.000Z',
        total_invested: 0,
        execution_count: 0,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }
      
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockRule,
        error: null
      })
      
      const result = await AutomationService.createAutomationRule(mockUserId, {
        portfolio_id: mockPortfolioId,
        name: 'Round-up Investing',
        is_active: true,
        investment_amount: 0,
        frequency: 'daily',
        trigger_type: 'round_up',
        allocation_strategy: 'equal_weight',
        asset_allocation: {
          'asset-voo': 100
        },
        round_up_multiplier: 2,
        next_execution: ''
      })
      
      expect(result).toEqual(mockRule)
    })
  })
  
  describe('executeScheduledInvestments', () => {
    it('should execute due scheduled investments', async () => {
      const dueRules = [
        {
          id: 'rule-123',
          user_id: mockUserId,
          portfolio_id: mockPortfolioId,
          name: 'Weekly DCA',
          is_active: true,
          investment_amount: 100,
          frequency: 'weekly',
          trigger_type: 'schedule',
          allocation_strategy: 'equal_weight',
          asset_allocation: {
            'asset-aapl': 50,
            'asset-googl': 50
          },
          next_execution: '2024-01-15T09:00:00Z',
          total_invested: 500,
          execution_count: 5
        }
      ]
      
      const assets = [
        { id: 'asset-aapl', symbol: 'AAPL', current_price: 180 },
        { id: 'asset-googl', symbol: 'GOOGL', current_price: 3000 }
      ]
      
      // Mock getting due rules
      mockSupabase._chain.lte.mockResolvedValueOnce({
        data: dueRules,
        error: null
      })
      
      // Mock asset prices lookup
      mockSupabase._chain.in.mockResolvedValueOnce({
        data: assets,
        error: null
      })
      
      // Mock rule updates
      mockSupabase._chain.eq.mockResolvedValue({
        error: null
      })
      
      // Mock transaction service
      ;(TransactionService.createTransaction as jest.Mock).mockResolvedValue({})
      ;(PortfolioService.calculateReturns as jest.Mock).mockResolvedValue({})
      
      const result = await AutomationService.executeScheduledInvestments()
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        automation_rule_id: 'rule-123',
        portfolio_id: mockPortfolioId,
        total_amount: 100,
        allocations: [
          {
            asset_id: 'asset-aapl',
            symbol: 'AAPL',
            amount: 50,
            quantity: 50 / 180,
            price: 180
          },
          {
            asset_id: 'asset-googl',
            symbol: 'GOOGL',
            amount: 50,
            quantity: 50 / 3000,
            price: 3000
          }
        ],
        executed_at: '2024-01-15T10:00:00.000Z',
        status: 'success'
      })
      
      // Verify transactions were created
      expect(TransactionService.createTransaction).toHaveBeenCalledTimes(2)
      expect(PortfolioService.calculateReturns).toHaveBeenCalledWith(mockPortfolioId)
    })
    
    it('should handle execution failures gracefully', async () => {
      const dueRules = [
        {
          id: 'rule-fail',
          user_id: mockUserId,
          portfolio_id: mockPortfolioId,
          name: 'Failed Rule',
          is_active: true,
          investment_amount: 100,
          frequency: 'daily',
          trigger_type: 'schedule',
          allocation_strategy: 'equal_weight',
          asset_allocation: { 'asset-invalid': 100 },
          next_execution: '2024-01-15T09:00:00Z',
          total_invested: 0,
          execution_count: 0
        }
      ]
      
      // Mock getting due rules
      mockSupabase._chain.lte.mockResolvedValueOnce({
        data: dueRules,
        error: null
      })
      
      // Mock asset prices lookup failure
      mockSupabase._chain.in.mockResolvedValueOnce({
        data: null,
        error: new Error('Asset not found')
      })
      
      const result = await AutomationService.executeScheduledInvestments()
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        automation_rule_id: 'rule-fail',
        portfolio_id: mockPortfolioId,
        total_amount: 0,
        allocations: [],
        executed_at: '2024-01-15T10:00:00.000Z',
        status: 'failed',
        error: 'Failed to fetch asset prices'
      })
    })
  })
  
  describe('processRoundUp', () => {
    it('should accumulate round-ups and execute when threshold reached', async () => {
      const roundUpRule = {
        id: 'rule-roundup',
        user_id: mockUserId,
        portfolio_id: mockPortfolioId,
        name: 'Round-up',
        is_active: true,
        investment_amount: 0,
        frequency: 'daily',
        trigger_type: 'round_up',
        allocation_strategy: 'equal_weight',
        asset_allocation: { 'asset-voo': 100 },
        round_up_multiplier: 2,
        total_invested: 100,
        execution_count: 20
      }
      
      const transaction = {
        transaction_id: 'txn-123',
        amount: 4.25,
        rounded_amount: 5.00,
        round_up_amount: 0.75,
        merchant: 'Coffee Shop',
        date: '2024-01-15'
      }
      
      // Mock getting round-up rules
      mockSupabase._chain.eq.mockResolvedValueOnce({
        data: [roundUpRule],
        error: null
      })
      
      // Mock insert round-up
      mockSupabase._chain.insert.mockResolvedValueOnce({
        error: null
      })
      
      // Mock accumulated round-ups (total = $6)
      mockSupabase._chain.eq.mockResolvedValueOnce({
        data: [
          { amount: 1.50 },
          { amount: 2.00 },
          { amount: 0.75 },
          { amount: 1.00 },
          { amount: 0.75 } // New round-up
        ],
        error: null
      })
      
      // Mock asset price
      mockSupabase._chain.in.mockResolvedValueOnce({
        data: [{ id: 'asset-voo', symbol: 'VOO', current_price: 450 }],
        error: null
      })
      
      // Mock update round-ups as invested
      mockSupabase._chain.eq.mockResolvedValueOnce({
        error: null
      })
      
      ;(TransactionService.createTransaction as jest.Mock).mockResolvedValue({})
      ;(PortfolioService.calculateReturns as jest.Mock).mockResolvedValue({})
      
      const result = await AutomationService.processRoundUp(mockUserId, transaction)
      
      expect(result).not.toBeNull()
      expect(result?.total_amount).toBe(6)
      expect(result?.allocations).toHaveLength(1)
      expect(result?.allocations[0]).toEqual({
        asset_id: 'asset-voo',
        symbol: 'VOO',
        amount: 6,
        quantity: 6 / 450,
        price: 450
      })
    })
    
    it('should not execute if threshold not reached', async () => {
      const roundUpRule = {
        id: 'rule-roundup',
        user_id: mockUserId,
        portfolio_id: mockPortfolioId,
        name: 'Round-up',
        is_active: true,
        investment_amount: 0,
        frequency: 'daily',
        trigger_type: 'round_up',
        allocation_strategy: 'equal_weight',
        asset_allocation: { 'asset-voo': 100 },
        round_up_multiplier: 1,
        total_invested: 100,
        execution_count: 20
      }
      
      const transaction = {
        transaction_id: 'txn-456',
        amount: 10.10,
        rounded_amount: 11.00,
        round_up_amount: 0.90,
        merchant: 'Grocery Store',
        date: '2024-01-15'
      }
      
      // Mock getting round-up rules
      mockSupabase._chain.eq.mockResolvedValueOnce({
        data: [roundUpRule],
        error: null
      })
      
      // Mock insert round-up
      mockSupabase._chain.insert.mockResolvedValueOnce({
        error: null
      })
      
      // Mock accumulated round-ups (total = $3.90, below $5 threshold)
      mockSupabase._chain.eq.mockResolvedValueOnce({
        data: [
          { amount: 1.50 },
          { amount: 1.50 },
          { amount: 0.90 } // New round-up
        ],
        error: null
      })
      
      const result = await AutomationService.processRoundUp(mockUserId, transaction)
      
      expect(result).toBeNull()
      expect(TransactionService.createTransaction).not.toHaveBeenCalled()
    })
  })
  
  describe('checkMarketDipTriggers', () => {
    it('should execute investment when market dips below threshold', async () => {
      const marketDipRule = {
        id: 'rule-dip',
        user_id: mockUserId,
        portfolio_id: mockPortfolioId,
        name: 'Buy the Dip',
        is_active: true,
        investment_amount: 500,
        frequency: 'daily',
        trigger_type: 'market_dip',
        allocation_strategy: 'equal_weight',
        asset_allocation: {
          'asset-aapl': 50,
          'asset-tsla': 50
        },
        market_dip_threshold: 5,
        total_invested: 1000,
        execution_count: 2
      }
      
      // Mock getting market dip rules
      mockSupabase._chain.eq.mockResolvedValueOnce({
        data: [marketDipRule],
        error: null
      })
      
      // Mock asset prices for dip check (AAPL down 6%)
      mockSupabase._chain.in.mockResolvedValueOnce({
        data: [
          { id: 'asset-aapl', current_price: 169.2, previous_close: 180 },
          { id: 'asset-tsla', current_price: 248, previous_close: 250 }
        ],
        error: null
      })
      
      // Mock asset prices for execution
      mockSupabase._chain.in.mockResolvedValueOnce({
        data: [
          { id: 'asset-aapl', symbol: 'AAPL', current_price: 169.2 },
          { id: 'asset-tsla', symbol: 'TSLA', current_price: 248 }
        ],
        error: null
      })
      
      // Mock rule update
      mockSupabase._chain.eq.mockResolvedValueOnce({
        error: null
      })
      
      ;(TransactionService.createTransaction as jest.Mock).mockResolvedValue({})
      ;(PortfolioService.calculateReturns as jest.Mock).mockResolvedValue({})
      
      const result = await AutomationService.checkMarketDipTriggers()
      
      expect(result).toHaveLength(1)
      expect(result[0].total_amount).toBe(500)
      expect(result[0].status).toBe('success')
    })
    
    it('should not execute if dip threshold not met', async () => {
      const marketDipRule = {
        id: 'rule-dip',
        user_id: mockUserId,
        portfolio_id: mockPortfolioId,
        name: 'Buy the Dip',
        is_active: true,
        investment_amount: 500,
        frequency: 'daily',
        trigger_type: 'market_dip',
        allocation_strategy: 'equal_weight',
        asset_allocation: {
          'asset-aapl': 100
        },
        market_dip_threshold: 10,
        total_invested: 0,
        execution_count: 0
      }
      
      // Mock getting market dip rules
      mockSupabase._chain.eq.mockResolvedValueOnce({
        data: [marketDipRule],
        error: null
      })
      
      // Mock asset prices for dip check (AAPL down only 2%)
      mockSupabase._chain.in.mockResolvedValueOnce({
        data: [
          { id: 'asset-aapl', current_price: 176.4, previous_close: 180 }
        ],
        error: null
      })
      
      const result = await AutomationService.checkMarketDipTriggers()
      
      expect(result).toHaveLength(0)
      expect(TransactionService.createTransaction).not.toHaveBeenCalled()
    })
  })
  
  describe('updateAutomationRule', () => {
    it('should update rule and recalculate next execution for frequency changes', async () => {
      const currentRule = {
        frequency: 'weekly',
        trigger_type: 'schedule'
      }
      
      const updatedRule = {
        id: 'rule-123',
        user_id: mockUserId,
        portfolio_id: mockPortfolioId,
        name: 'Updated DCA',
        is_active: true,
        investment_amount: 200,
        frequency: 'monthly',
        trigger_type: 'schedule',
        next_execution: '2024-02-15T10:00:00.000Z'
      }
      
      // Mock current rule lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: currentRule,
        error: null
      })
      
      // Mock update
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: updatedRule,
        error: null
      })
      
      const result = await AutomationService.updateAutomationRule(
        mockUserId,
        'rule-123',
        {
          investment_amount: 200,
          frequency: 'monthly'
        }
      )
      
      expect(result).toEqual(updatedRule)
      expect(mockSupabase._chain.update).toHaveBeenCalledWith({
        investment_amount: 200,
        frequency: 'monthly',
        next_execution: '2024-02-15T10:00:00.000Z'
      })
    })
  })
})