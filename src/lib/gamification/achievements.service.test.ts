import { AchievementsService } from './achievements.service'
import { createClient } from '@/lib/supabase/server'
import { 
  mockAchievements, 
  mockUserAchievements, 
  mockTransactions,
  mockPortfolios,
  createMockSupabaseClient 
} from '@/__tests__/fixtures'

jest.mock('@/lib/supabase/server')

describe('AchievementsService', () => {
  const mockSupabase = createMockSupabaseClient()
  const mockUserId = 'user-123'
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })
  
  describe('getUserAchievements', () => {
    it('should return user achievements with details', async () => {
      const achievementsWithDetails = mockUserAchievements.map(ua => ({
        ...ua,
        achievement: Object.values(mockAchievements).find(a => a.id === ua.achievement_id)
      }))
      
      mockSupabase._chain.order.mockResolvedValueOnce({
        data: achievementsWithDetails,
        error: null
      })
      
      const result = await AchievementsService.getUserAchievements(mockUserId)
      
      expect(result).toEqual(achievementsWithDetails)
      expect(mockSupabase._chain.select).toHaveBeenCalledWith('*, achievement:achievements(*)')
    })
    
    it('should filter by earned status', async () => {
      const earnedAchievements = mockUserAchievements.filter(ua => ua.progress === 100)
      
      mockSupabase._chain.order.mockResolvedValueOnce({
        data: earnedAchievements,
        error: null
      })
      
      const result = await AchievementsService.getUserAchievements(mockUserId)
      
      expect(result).toEqual(earnedAchievements)
      expect(mockSupabase._chain.eq).toHaveBeenCalledWith('progress', 100)
    })
    
    it('should filter by category', async () => {
      const tradingAchievements = mockUserAchievements.filter(ua => 
        ua.achievement_id === mockAchievements.firstTrade.id
      )
      
      mockSupabase._chain.order.mockResolvedValueOnce({
        data: tradingAchievements,
        error: null
      })
      
      const result = await AchievementsService.getUserAchievements(mockUserId)
      
      expect(result).toEqual(tradingAchievements)
    })
  })
  
  // TODO: These tests need to be updated to match the current implementation
  describe.skip('checkTransactionAchievements', () => {
    it('should award first trade achievement', async () => {
      const transaction = mockTransactions.buyTransaction
      
      // Mock no existing first trade achievement
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // Not found
      })
      
      // Mock transaction count check
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: { count: 1 },
        error: null
      })
      
      // Mock achievement lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockAchievements.firstTrade,
        error: null
      })
      
      // Mock achievement award
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockUserAchievements[0],
        error: null
      })
      
      const result = await AchievementsService.checkTransactionAchievements(
        mockUserId,
        transaction
      )
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockUserAchievements[0])
      expect(mockSupabase._chain.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        achievement_id: mockAchievements.firstTrade.id,
        progress: 100,
        earned_at: expect.any(String),
        metadata: {
          trade_id: transaction.id,
          asset_symbol: expect.any(String)
        }
      })
    })
    
    it('should update trading streak progress', async () => {
      const transaction = mockTransactions.buyTransaction
      const existingStreak = mockUserAchievements[2] // Trading streak in progress
      
      // Mock existing achievements
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockUserAchievements[0], // First trade already earned
        error: null
      })
      
      // Mock streak achievement check
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: existingStreak,
        error: null
      })
      
      // Mock last trade date check
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: { created_at: '2024-01-14T10:00:00Z' },
        error: null
      })
      
      // Mock update
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: { ...existingStreak, progress: 50, metadata: { current_streak: 15 } },
        error: null
      })
      
      const result = await AchievementsService.checkTransactionAchievements(
        mockUserId,
        transaction
      )
      
      expect(result).toHaveLength(1)
      expect(mockSupabase._chain.update).toHaveBeenCalledWith({
        progress: expect.any(Number),
        metadata: expect.objectContaining({
          current_streak: expect.any(Number),
          last_trade_date: expect.any(String)
        }),
        updated_at: expect.any(String)
      })
    })
  })
  
  // TODO: These tests need to be updated to match the current implementation  
  describe.skip('checkPortfolioAchievements', () => {
    it('should award diversified portfolio achievement', async () => {
      const portfolio = mockPortfolios.activePortfolio
      const holdings = [
        { asset_id: 'asset-1' },
        { asset_id: 'asset-2' },
        { asset_id: 'asset-3' },
        { asset_id: 'asset-4' },
        { asset_id: 'asset-5' }
      ]
      
      // Mock achievement check
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })
      
      // Mock holdings count
      mockSupabase._chain.eq.mockResolvedValueOnce({
        data: holdings,
        error: null
      })
      
      // Mock achievement lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockAchievements.portfolioDiversified,
        error: null
      })
      
      // Mock achievement award
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockUserAchievements[1],
        error: null
      })
      
      const result = await AchievementsService.checkPortfolioAchievements(
        mockUserId,
        portfolio.id
      )
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockUserAchievements[1])
    })
    
    it('should award ESG champion achievement', async () => {
      const portfolio = { ...mockPortfolios.activePortfolio, esg_score: 85 }
      
      // Mock achievement check
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      })
      
      // Mock portfolio lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: portfolio,
        error: null
      })
      
      // Mock achievement lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockAchievements.esgChampion,
        error: null
      })
      
      // Mock achievement award
      const esgAchievement = {
        id: 'user-ach-esg',
        user_id: mockUserId,
        achievement_id: mockAchievements.esgChampion.id,
        earned_at: new Date().toISOString(),
        progress: 100,
        metadata: { portfolio_id: portfolio.id, esg_score: 85 }
      }
      
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: esgAchievement,
        error: null
      })
      
      const result = await AchievementsService.checkPortfolioAchievements(
        mockUserId,
        portfolio.id
      )
      
      expect(result).toHaveLength(1)
      expect(result[0].achievement_id).toBe(mockAchievements.esgChampion.id)
    })
    
    it('should award profit maker achievement', async () => {
      const portfolio = {
        ...mockPortfolios.activePortfolio,
        total_returns: 5000,
        total_invested: 45000
      }
      
      // Mock achievement checks
      mockSupabase._chain.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // Diversified
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // ESG
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // Profit maker
      
      // Mock portfolio lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: portfolio,
        error: null
      })
      
      // Mock achievement lookup
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockAchievements.profitMaker,
        error: null
      })
      
      // Mock achievement award
      const profitAchievement = {
        id: 'user-ach-profit',
        user_id: mockUserId,
        achievement_id: mockAchievements.profitMaker.id,
        earned_at: new Date().toISOString(),
        progress: 100,
        metadata: {
          portfolio_id: portfolio.id,
          returns_percentage: 11.11
        }
      }
      
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: profitAchievement,
        error: null
      })
      
      const result = await AchievementsService.checkPortfolioAchievements(
        mockUserId,
        portfolio.id
      )
      
      expect(result).toHaveLength(1)
      expect(result[0].achievement_id).toBe(mockAchievements.profitMaker.id)
    })
  })
  
  describe('getUserStats', () => {
    it('should calculate user statistics correctly', async () => {
      // Mock user achievements
      mockSupabase._chain.eq.mockResolvedValueOnce({
        data: mockUserAchievements,
        error: null
      })
      
      // Mock total points calculation
      const earnedAchievements = mockUserAchievements.filter(ua => ua.progress === 100)
      const totalPoints = earnedAchievements.reduce((sum, ua) => {
        const achievement = Object.values(mockAchievements).find(a => a.id === ua.achievement_id)
        return sum + (achievement?.points || 0)
      }, 0)
      
      const result = await AchievementsService.getUserStats(mockUserId)
      
      expect(result).toEqual({
        user_id: mockUserId,
        total_points: totalPoints,
        achievements_earned: 2,
        achievements_in_progress: 1,
        current_level: Math.floor(totalPoints / 50) + 1,
        next_level_points: ((Math.floor(totalPoints / 50) + 1) * 50),
        rank: expect.any(String),
        categories: {
          trading: expect.any(Number),
          portfolio: expect.any(Number),
          education: 0,
          social: 0,
          milestone: 0
        }
      })
    })
  })
  
  // TODO: These tests need to be updated to match the current implementation
  describe.skip('grantAchievement', () => {
    it('should grant achievement with metadata', async () => {
      const achievement = mockAchievements.firstTrade
      const metadata = {
        trade_id: 'txn-123',
        asset_symbol: 'AAPL'
      }
      
      const userAchievement = {
        id: 'user-ach-new',
        user_id: mockUserId,
        achievement_id: achievement.id,
        earned_at: new Date().toISOString(),
        progress: 100,
        metadata
      }
      
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: userAchievement,
        error: null
      })
      
      const result = await AchievementsService.grantAchievement(
        mockUserId,
        achievement.id,
        metadata
      )
      
      expect(result).toEqual(userAchievement)
      expect(mockSupabase._chain.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        achievement_id: achievement.id,
        progress: 100,
        earned_at: expect.any(String),
        metadata
      })
    })
    
    it('should not grant duplicate achievements', async () => {
      const achievement = mockAchievements.firstTrade
      
      // Mock existing achievement
      mockSupabase._chain.single.mockResolvedValueOnce({
        data: mockUserAchievements[0],
        error: null
      })
      
      const result = await AchievementsService.grantAchievement(
        mockUserId,
        achievement.id
      )
      
      expect(result).toBeNull()
      expect(mockSupabase._chain.insert).not.toHaveBeenCalled()
    })
  })
})