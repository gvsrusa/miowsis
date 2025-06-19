import { GET, POST } from './route'
import { getServerSession } from 'next-auth'
import { PortfolioService } from '@/lib/portfolio/portfolio.service'
import { mockUsers, mockPortfolios, mockSession } from '@/__tests__/fixtures'
import { NextRequest } from 'next/server'

jest.mock('next-auth')
jest.mock('@/lib/portfolio/portfolio.service')
jest.mock('@/lib/auth', () => ({
  authOptions: {}
}))

describe('Portfolio API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('GET /api/portfolios', () => {
    it('should return portfolios for authenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(PortfolioService.getPortfolios as jest.Mock).mockResolvedValue([
        mockPortfolios.activePortfolio,
        mockPortfolios.inactivePortfolio
      ])
      
      const response = await GET()
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.portfolios).toHaveLength(2)
      expect(data.portfolios[0]).toEqual(mockPortfolios.activePortfolio)
      expect(PortfolioService.getPortfolios).toHaveBeenCalledWith(mockUsers.testUser.id)
    })
    
    it('should return 401 for unauthenticated requests', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)
      
      const response = await GET()
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(PortfolioService.getPortfolios).not.toHaveBeenCalled()
    })
    
    it('should handle service errors gracefully', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(PortfolioService.getPortfolios as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )
      
      const response = await GET()
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch portfolios')
    })
  })
  
  describe('POST /api/portfolios', () => {
    it('should create a new portfolio', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(PortfolioService.createPortfolio as jest.Mock).mockResolvedValue(
        mockPortfolios.emptyPortfolio
      )
      
      const request = new NextRequest('http://localhost:3000/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Portfolio',
          currency: 'USD'
        })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.portfolio).toEqual(mockPortfolios.emptyPortfolio)
      expect(PortfolioService.createPortfolio).toHaveBeenCalledWith(
        mockUsers.testUser.id,
        {
          name: 'New Portfolio',
          currency: 'USD'
        }
      )
    })
    
    it('should validate required fields', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      
      const request = new NextRequest('http://localhost:3000/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Missing name field'
        })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
      expect(data.details).toBeDefined()
      expect(PortfolioService.createPortfolio).not.toHaveBeenCalled()
    })
    
    it('should handle portfolio limit errors', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(PortfolioService.createPortfolio as jest.Mock).mockRejectedValue(
        new Error('Maximum portfolio limit reached')
      )
      
      const request = new NextRequest('http://localhost:3000/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Another Portfolio'
        })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Maximum portfolio limit reached')
    })
    
    it('should return 401 for unauthenticated requests', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Portfolio'
        })
      })
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(PortfolioService.createPortfolio).not.toHaveBeenCalled()
    })
  })
})