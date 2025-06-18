import { PortfolioService } from './portfolio.service'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/supabase/server')
jest.mock('next/cache')

describe('PortfolioService', () => {
  const mockSupabase = {
    from: jest.fn(),
  }
  
  const mockUserId = 'user-123'
  const mockPortfolioId = 'portfolio-123'
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })
  
  describe('createPortfolio', () => {
    it('should create a new portfolio', async () => {
      const mockCount = { count: 0 }
      const mockPortfolio = {
        id: mockPortfolioId,
        user_id: mockUserId,
        name: 'My Portfolio',
        currency: 'USD',
      }
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue(mockCount),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPortfolio, error: null }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      })
      
      const result = await PortfolioService.createPortfolio(mockUserId, {
        name: 'My Portfolio',
      })
      
      expect(result).toEqual(mockPortfolio)
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
      expect(revalidatePath).toHaveBeenCalledWith('/portfolios')
    })
    
    it('should throw error if user has 5 portfolios', async () => {
      const mockCount = { count: 5 }
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue(mockCount),
        }),
      })
      
      await expect(
        PortfolioService.createPortfolio(mockUserId, { name: 'New Portfolio' })
      ).rejects.toThrow('Maximum portfolio limit reached')
    })
  })
  
  describe('getPortfolios', () => {
    it('should return portfolios with stats', async () => {
      const mockPortfolios = [
        {
          id: 'portfolio-1',
          name: 'Portfolio 1',
          holdings: [{ count: 5 }],
          transactions: [{ created_at: '2024-01-01' }],
        },
        {
          id: 'portfolio-2',
          name: 'Portfolio 2',
          holdings: [],
          transactions: [],
        },
      ]
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockPortfolios, error: null }),
          }),
        }),
      })
      
      const result = await PortfolioService.getPortfolios(mockUserId)
      
      expect(result).toHaveLength(2)
      expect(result[0].holdings_count).toBe(5)
      expect(result[0].last_transaction_at).toBe('2024-01-01')
      expect(result[1].holdings_count).toBe(0)
      expect(result[1].last_transaction_at).toBeNull()
    })
  })
  
  describe('updatePortfolio', () => {
    it('should update portfolio and deactivate others if setting active', async () => {
      const mockPortfolio = { id: mockPortfolioId, is_active: true }
      
      mockSupabase.from.mockImplementation(() => {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              neq: jest.fn().mockResolvedValue({ error: null }),
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockPortfolio, error: null }),
                }),
              }),
            }),
          }),
        }
      })
      
      const result = await PortfolioService.updatePortfolio(
        mockUserId,
        mockPortfolioId,
        { is_active: true }
      )
      
      expect(result).toEqual(mockPortfolio)
      expect(mockSupabase.from).toHaveBeenCalledTimes(2) // Once for deactivating, once for updating
    })
  })
  
  describe('deletePortfolio', () => {
    it('should delete portfolio if no holdings', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'holdings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ count: 0 }),
            }),
          }
        }
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }
      })
      
      const result = await PortfolioService.deletePortfolio(mockUserId, mockPortfolioId)
      
      expect(result).toEqual({ success: true })
    })
    
    it('should throw error if portfolio has holdings', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: 5 }),
        }),
      })
      
      await expect(
        PortfolioService.deletePortfolio(mockUserId, mockPortfolioId)
      ).rejects.toThrow('Cannot delete portfolio with holdings')
    })
  })
  
  describe('calculateReturns', () => {
    it('should calculate portfolio returns correctly', async () => {
      const mockHoldings = [
        {
          quantity: 10,
          average_cost: 100,
          asset: { symbol: 'AAPL', current_price: 120 },
        },
        {
          quantity: 5,
          average_cost: 200,
          asset: { symbol: 'GOOGL', current_price: 180 },
        },
      ]
      
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'holdings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: mockHoldings, error: null }),
            }),
          }
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }
      })
      
      const result = await PortfolioService.calculateReturns(mockPortfolioId)
      
      expect(result.totalValue).toBe(2100) // (10*120) + (5*180)
      expect(result.totalInvested).toBe(2000) // (10*100) + (5*200)
      expect(result.totalReturns).toBe(100) // 2100 - 2000
      expect(result.returnsPercentage).toBe(5) // (100/2000)*100
    })
  })
})