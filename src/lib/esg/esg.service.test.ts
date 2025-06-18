import { ESGService } from './esg.service'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

describe('ESGService', () => {
  const mockSupabase = {
    from: jest.fn(),
  }
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })
  
  describe('calculateAssetESGScore', () => {
    it('should return ESG scores within expected ranges', async () => {
      const score = await ESGService.calculateAssetESGScore('asset-123')
      
      expect(score.environmental_score).toBeGreaterThanOrEqual(60)
      expect(score.environmental_score).toBeLessThanOrEqual(90)
      expect(score.social_score).toBeGreaterThanOrEqual(60)
      expect(score.social_score).toBeLessThanOrEqual(90)
      expect(score.governance_score).toBeGreaterThanOrEqual(60)
      expect(score.governance_score).toBeLessThanOrEqual(90)
      expect(score.total_score).toBeGreaterThanOrEqual(60)
      expect(score.total_score).toBeLessThanOrEqual(90)
      expect(score.carbon_footprint).toBeGreaterThanOrEqual(0)
      expect(score.carbon_footprint).toBeLessThanOrEqual(100)
    })
  })
  
  describe('updateAssetESGScores', () => {
    it('should update asset ESG scores in database', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null })
      mockSupabase.from.mockReturnValue({
        upsert: mockUpsert,
      })
      
      const result = await ESGService.updateAssetESGScores('asset-123')
      
      expect(mockSupabase.from).toHaveBeenCalledWith('esg_metrics')
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          asset_id: 'asset-123',
          environmental_score: expect.any(Number),
          social_score: expect.any(Number),
          governance_score: expect.any(Number),
          total_score: expect.any(Number),
          carbon_footprint: expect.any(Number),
          last_updated: expect.any(String),
        })
      )
      expect(result).toHaveProperty('total_score')
    })
    
    it('should throw error if database update fails', async () => {
      const mockError = new Error('Database error')
      mockSupabase.from.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: mockError }),
      })
      
      await expect(ESGService.updateAssetESGScores('asset-123')).rejects.toThrow(mockError)
    })
  })
  
  describe('getPortfolioESGImpact', () => {
    it('should calculate weighted ESG score correctly', async () => {
      const mockHoldings = [
        {
          quantity: 10,
          asset: {
            id: 'asset-1',
            symbol: 'AAPL',
            name: 'Apple Inc',
            current_price: 100,
            esg_metrics: [{
              total_score: 80,
              environmental_score: 85,
              social_score: 75,
              governance_score: 80,
              carbon_footprint: 50,
              last_updated: '2024-01-01',
            }],
          },
        },
        {
          quantity: 5,
          asset: {
            id: 'asset-2',
            symbol: 'MSFT',
            name: 'Microsoft Corp',
            current_price: 200,
            esg_metrics: [{
              total_score: 90,
              environmental_score: 92,
              social_score: 88,
              governance_score: 90,
              carbon_footprint: 30,
              last_updated: '2024-01-01',
            }],
          },
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
      
      const result = await ESGService.getPortfolioESGImpact('portfolio-123')
      
      // Weighted ESG = (80 * 1000 + 90 * 1000) / 2000 = 85
      expect(result.weighted_esg_score).toBe(85)
      expect(result.total_carbon_footprint).toBe(650) // 10*50 + 5*30
      expect(result.governance_rating).toBe('Excellent')
      expect(result.top_esg_holdings).toHaveLength(2)
      expect(result.top_esg_holdings[0].symbol).toBe('MSFT')
      expect(result.recommendations).toBeInstanceOf(Array)
    })
    
    it('should generate appropriate recommendations', async () => {
      const mockHoldings = [
        {
          quantity: 10,
          asset: {
            id: 'asset-1',
            symbol: 'BAD',
            name: 'Bad ESG Corp',
            current_price: 100,
            esg_metrics: [{
              total_score: 40,
              environmental_score: 35,
              social_score: 40,
              governance_score: 45,
              carbon_footprint: 150,
              last_updated: '2024-01-01',
            }],
          },
        },
        {
          quantity: 5,
          asset: {
            id: 'asset-2',
            symbol: 'MID',
            name: 'Mid ESG Corp',
            current_price: 100,
            esg_metrics: [{
              total_score: 65,
              environmental_score: 65,
              social_score: 65,
              governance_score: 65,
              carbon_footprint: 70,
              last_updated: '2024-01-01',
            }],
          },
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
      
      const result = await ESGService.getPortfolioESGImpact('portfolio-123')
      
      const divestRecs = result.recommendations.filter(r => r.type === 'divest')
      const improveRecs = result.recommendations.filter(r => r.type === 'improve')
      const investRecs = result.recommendations.filter(r => r.type === 'invest')
      
      expect(divestRecs).toHaveLength(1)
      expect(divestRecs[0].asset_symbol).toBe('BAD')
      expect(improveRecs).toHaveLength(1)
      expect(improveRecs[0].asset_symbol).toBe('MID')
      expect(investRecs).toHaveLength(1)
    })
  })
  
  describe('trackImpactMetrics', () => {
    it('should store impact metrics', async () => {
      const mockImpact = {
        portfolio_id: 'portfolio-123',
        weighted_esg_score: 75,
        total_carbon_footprint: 500,
        total_carbon_offset: 50,
        net_carbon_impact: 450,
        renewable_energy_exposure: 60,
        social_impact_score: 70,
        governance_rating: 'Good',
        top_esg_holdings: [],
        bottom_esg_holdings: [],
        recommendations: [],
      }
      
      jest.spyOn(ESGService, 'getPortfolioESGImpact').mockResolvedValue(mockImpact)
      
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      })
      
      const result = await ESGService.trackImpactMetrics('portfolio-123')
      
      expect(result).toEqual(mockImpact)
      expect(mockSupabase.from).toHaveBeenCalledWith('impact_tracking')
    })
  })
})