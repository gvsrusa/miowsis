import { GET, PATCH, DELETE } from './route'
import { getServerSession } from 'next-auth'
import { PortfolioService } from '@/lib/portfolio/portfolio.service'
import { mockUsers, mockPortfolios, mockSession } from '@/__tests__/fixtures'
import { NextRequest } from 'next/server'

jest.mock('next-auth')
jest.mock('@/lib/portfolio/portfolio.service')
jest.mock('@/lib/auth', () => ({
  authOptions: {}
}))

describe('Portfolio [portfolioId] API Routes', () => {
  const mockPortfolioId = mockPortfolios.activePortfolio.id
  const mockParams = { params: Promise.resolve({ portfolioId: mockPortfolioId }) }
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('GET /api/portfolios/[portfolioId]', () => {
    it('should return portfolio details for authenticated user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(PortfolioService.getPortfolio as jest.Mock).mockResolvedValue(
        mockPortfolios.activePortfolio
      )
      
      const response = await GET(new NextRequest('http://localhost:3000'), mockParams)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.portfolio).toEqual(mockPortfolios.activePortfolio)
      expect(PortfolioService.getPortfolio).toHaveBeenCalledWith(
        mockUsers.testUser.id,
        mockPortfolioId
      )
    })
    
    it('should return 404 for non-existent portfolio', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(PortfolioService.getPortfolio as jest.Mock).mockRejectedValue(
        new Error('Portfolio not found')
      )
      
      const response = await GET(new NextRequest('http://localhost:3000'), mockParams)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.error).toBe('Portfolio not found')
    })
    
    it('should return 401 for unauthenticated requests', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)
      
      const response = await GET(new NextRequest('http://localhost:3000'), mockParams)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(PortfolioService.getPortfolio).not.toHaveBeenCalled()
    })
  })
  
  describe('PATCH /api/portfolios/[portfolioId]', () => {
    it('should update portfolio settings', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(PortfolioService.updatePortfolio as jest.Mock).mockResolvedValue({
        ...mockPortfolios.activePortfolio,
        name: 'Updated Portfolio Name',
        is_active: true
      })
      
      const request = new NextRequest('http://localhost:3000', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Portfolio Name',
          is_active: true
        })
      })
      
      const response = await PATCH(request, mockParams)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.portfolio.name).toBe('Updated Portfolio Name')
      expect(PortfolioService.updatePortfolio).toHaveBeenCalledWith(
        mockUsers.testUser.id,
        mockPortfolioId,
        {
          name: 'Updated Portfolio Name',
          is_active: true
        }
      )
    })
    
    it('should validate update data', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      
      const request = new NextRequest('http://localhost:3000', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '', // Empty name should fail validation
          is_active: 'not-a-boolean'
        })
      })
      
      const response = await PATCH(request, mockParams)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
      expect(data.details).toBeDefined()
      expect(PortfolioService.updatePortfolio).not.toHaveBeenCalled()
    })
    
    it('should handle update errors', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(PortfolioService.updatePortfolio as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )
      
      const request = new NextRequest('http://localhost:3000', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Name'
        })
      })
      
      const response = await PATCH(request, mockParams)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update portfolio')
    })
  })
  
  describe('DELETE /api/portfolios/[portfolioId]', () => {
    it('should delete portfolio without holdings', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(PortfolioService.deletePortfolio as jest.Mock).mockResolvedValue({
        success: true
      })
      
      const response = await DELETE(new NextRequest('http://localhost:3000'), mockParams)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(PortfolioService.deletePortfolio).toHaveBeenCalledWith(
        mockUsers.testUser.id,
        mockPortfolioId
      )
    })
    
    it('should handle delete errors for portfolios with holdings', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(PortfolioService.deletePortfolio as jest.Mock).mockRejectedValue(
        new Error('Cannot delete portfolio with holdings')
      )
      
      const response = await DELETE(new NextRequest('http://localhost:3000'), mockParams)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot delete portfolio with holdings')
    })
    
    it('should return 401 for unauthenticated requests', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)
      
      const response = await DELETE(new NextRequest('http://localhost:3000'), mockParams)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(PortfolioService.deletePortfolio).not.toHaveBeenCalled()
    })
    
    it('should handle general delete errors', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(PortfolioService.deletePortfolio as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )
      
      const response = await DELETE(new NextRequest('http://localhost:3000'), mockParams)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete portfolio')
    })
  })
})