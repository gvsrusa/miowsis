import { TransactionService } from './transaction.service'
import { createClient } from '@/lib/supabase/server'
import { AchievementsService } from '@/lib/gamification/achievements.service'
import { mockTransactions, mockAssets, createMockSupabaseClient } from '@/__tests__/fixtures'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/gamification/achievements.service')

describe('TransactionService', () => {
  const mockSupabase = createMockSupabaseClient()
  const mockUserId = 'user-123'
  const mockPortfolioId = 'portfolio-123'
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })
  
  describe('createTransaction', () => {
    it('should create a buy transaction successfully', async () => {
      const mockAsset = mockAssets.apple
      const mockTransaction = mockTransactions.buyTransaction
      const mockHolding = {
        id: 'holding-123',
        portfolio_id: mockPortfolioId,
        asset_id: mockAsset.id,
        quantity: 10,
        average_cost: 150
      }
      
      // Mock asset lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockAsset,
        error: null
      })
      
      // Mock holding lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockHolding,
        error: null
      })
      
      // Mock transaction insert
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockTransaction,
        error: null
      })
      
      // Mock holding update
      mockSupabase._chain.eq.mockResolvedValueOnce({
        error: null
      })
      
      const result = await TransactionService.createTransaction(mockUserId, {
        portfolioId: mockPortfolioId,
        assetId: mockAsset.id,
        type: 'buy',
        quantity: 10,
        price: 150,
        fees: 9.99,
        notes: 'Initial purchase of AAPL'
      })
      
      expect(result).toEqual(mockTransaction)
      expect(AchievementsService.checkTransactionAchievements).toHaveBeenCalledWith(
        mockUserId,
        mockTransaction
      )
    })
    
    it('should create a sell transaction and update holdings', async () => {
      const mockAsset = mockAssets.tesla
      const mockTransaction = mockTransactions.sellTransaction
      const mockHolding = {
        id: 'holding-456',
        portfolio_id: mockPortfolioId,
        asset_id: mockAsset.id,
        quantity: 10,
        average_cost: 200
      }
      
      // Mock asset lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockAsset,
        error: null
      })
      
      // Mock holding lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockHolding,
        error: null
      })
      
      // Mock transaction insert
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockTransaction,
        error: null
      })
      
      // Mock holding update (reduce quantity)
      mockSupabase._chain.eq.mockResolvedValueOnce({
        error: null
      })
      
      const result = await TransactionService.createTransaction(mockUserId, {
        portfolioId: mockPortfolioId,
        assetId: mockAsset.id,
        type: 'sell',
        quantity: 5,
        price: 250,
        fees: 9.99,
        notes: 'Taking profits on TSLA'
      })
      
      expect(result).toEqual(mockTransaction)
      expect(mockSupabase.from).toHaveBeenCalledWith('holdings')
      expect(mockSupabase._chain.update).toHaveBeenCalledWith({
        quantity: 5, // 10 - 5
        updated_at: expect.any(String)
      })
    })
    
    it('should handle insufficient holdings for sell orders', async () => {
      const mockAsset = mockAssets.google
      const mockHolding = {
        id: 'holding-789',
        portfolio_id: mockPortfolioId,
        asset_id: mockAsset.id,
        quantity: 2,
        average_cost: 2800
      }
      
      // Mock asset lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockAsset,
        error: null
      })
      
      // Mock holding lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockHolding,
        error: null
      })
      
      await expect(
        TransactionService.createTransaction(mockUserId, {
          portfolioId: mockPortfolioId,
          assetId: mockAsset.id,
          type: 'sell',
          quantity: 5, // More than available
          price: 3000,
          fees: 0
        })
      ).rejects.toThrow('Insufficient holdings')
    })
    
    it('should create dividend transaction without affecting holdings', async () => {
      const mockAsset = mockAssets.apple
      const mockTransaction = mockTransactions.dividendTransaction
      
      // Mock asset lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockAsset,
        error: null
      })
      
      // Mock transaction insert
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockTransaction,
        error: null
      })
      
      const result = await TransactionService.createTransaction(mockUserId, {
        portfolioId: mockPortfolioId,
        assetId: mockAsset.id,
        type: 'dividend',
        quantity: 0,
        price: 0,
        totalAmount: 22.50,
        fees: 0,
        notes: 'Q4 2023 dividend payment'
      })
      
      expect(result).toEqual(mockTransaction)
      // Verify holdings are not updated for dividends
      expect(mockSupabase.from).not.toHaveBeenCalledWith('holdings')
    })
  })
  
  describe('getTransactions', () => {
    it('should return paginated transactions with asset details', async () => {
      const mockTransactionsWithAssets = [
        {
          ...mockTransactions.buyTransaction,
          asset: mockAssets.apple
        },
        {
          ...mockTransactions.sellTransaction,
          asset: mockAssets.tesla
        }
      ]
      
      mockSupabase._chain.order.mockResolvedValueOnce({
        data: mockTransactionsWithAssets,
        error: null
      })
      
      const result = await TransactionService.getTransactions(mockUserId, {
        portfolioId: mockPortfolioId,
        page: 1,
        limit: 10
      })
      
      expect(result).toEqual(mockTransactionsWithAssets)
      expect(mockSupabase._chain.order).toHaveBeenCalledWith('created_at', {
        ascending: false
      })
      expect(mockSupabase._chain.limit).toHaveBeenCalledWith(10)
    })
    
    it('should filter transactions by type', async () => {
      const buyTransactions = [
        {
          ...mockTransactions.buyTransaction,
          asset: mockAssets.apple
        }
      ]
      
      mockSupabase._chain.order.mockResolvedValueOnce({
        data: buyTransactions,
        error: null
      })
      
      const result = await TransactionService.getTransactions(mockUserId, {
        portfolioId: mockPortfolioId,
        type: 'buy'
      })
      
      expect(result).toEqual(buyTransactions)
      expect(mockSupabase._chain.eq).toHaveBeenCalledWith('type', 'buy')
    })
    
    it('should filter transactions by status', async () => {
      const pendingTransactions = [
        {
          ...mockTransactions.pendingTransaction,
          asset: mockAssets.google
        }
      ]
      
      mockSupabase._chain.order.mockResolvedValueOnce({
        data: pendingTransactions,
        error: null
      })
      
      const result = await TransactionService.getTransactions(mockUserId, {
        portfolioId: mockPortfolioId,
        status: 'pending'
      })
      
      expect(result).toEqual(pendingTransactions)
      expect(mockSupabase._chain.eq).toHaveBeenCalledWith('status', 'pending')
    })
  })
  
  describe('updateTransaction', () => {
    it('should update transaction status', async () => {
      const updatedTransaction = {
        ...mockTransactions.pendingTransaction,
        status: 'completed',
        executed_at: new Date().toISOString()
      }
      
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: updatedTransaction,
        error: null
      })
      
      const result = await TransactionService.updateTransaction(
        mockUserId,
        mockTransactions.pendingTransaction.id,
        {
          status: 'completed',
          executed_at: updatedTransaction.executed_at
        }
      )
      
      expect(result).toEqual(updatedTransaction)
    })
    
    it('should not allow updating completed transactions', async () => {
      // First mock the transaction lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockTransactions.buyTransaction, // Already completed
        error: null
      })
      
      await expect(
        TransactionService.updateTransaction(
          mockUserId,
          mockTransactions.buyTransaction.id,
          { price: 160 }
        )
      ).rejects.toThrow('Cannot update completed transaction')
    })
  })
  
  describe('cancelTransaction', () => {
    it('should cancel pending transaction', async () => {
      const cancelledTransaction = {
        ...mockTransactions.pendingTransaction,
        status: 'cancelled',
        updated_at: new Date().toISOString()
      }
      
      // Mock transaction lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockTransactions.pendingTransaction,
        error: null
      })
      
      // Mock update
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: cancelledTransaction,
        error: null
      })
      
      const result = await TransactionService.cancelTransaction(
        mockUserId,
        mockTransactions.pendingTransaction.id
      )
      
      expect(result).toEqual(cancelledTransaction)
    })
    
    it('should not allow cancelling completed transactions', async () => {
      // Mock transaction lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockTransactions.buyTransaction,
        error: null
      })
      
      await expect(
        TransactionService.cancelTransaction(
          mockUserId,
          mockTransactions.buyTransaction.id
        )
      ).rejects.toThrow('Can only cancel pending transactions')
    })
  })
  
  describe('getTransactionSummary', () => {
    it('should calculate transaction summary correctly', async () => {
      const transactions = [
        mockTransactions.buyTransaction,
        mockTransactions.sellTransaction,
        mockTransactions.dividendTransaction,
        mockTransactions.pendingTransaction,
        mockTransactions.failedTransaction
      ]
      
      mockSupabase._chain.order.mockResolvedValueOnce({
        data: transactions,
        error: null
      })
      
      const result = await TransactionService.getTransactionSummary(
        mockUserId,
        mockPortfolioId
      )
      
      expect(result).toEqual({
        total_transactions: 5,
        completed_transactions: 3,
        pending_transactions: 1,
        failed_transactions: 1,
        total_invested: 1500, // Only buy transactions
        total_sold: 1250,
        total_dividends: 22.50,
        total_fees: 19.98,
        net_invested: 272.50 // 1500 - 1250 + 22.50
      })
    })
  })
})