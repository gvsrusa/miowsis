import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import PortfoliosPage from '../page'
import { toast } from 'sonner'

jest.mock('next-auth/react')
jest.mock('next/navigation')
jest.mock('sonner')

// Mock fetch
global.fetch = jest.fn()

describe('PortfoliosPage', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
  const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  }
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(toast.success as jest.Mock) = mockToast.success
    ;(toast.error as jest.Mock) = mockToast.error
  })
  
  it('redirects to signin when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })
    
    render(<PortfoliosPage />)
    
    expect(mockRedirect).toHaveBeenCalledWith('/auth/signin')
  })
  
  it('shows loading skeleton while fetching portfolios', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '123' }, expires: '' },
      status: 'authenticated' as const,
      update: jest.fn(),
    })
    
    render(<PortfoliosPage />)
    
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })
  
  it('displays empty state when no portfolios', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '123' }, expires: '' },
      status: 'authenticated' as const,
      update: jest.fn(),
    })
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ portfolios: [] }),
    })
    
    render(<PortfoliosPage />)
    
    await waitFor(() => {
      expect(screen.getByText('No portfolios yet')).toBeInTheDocument()
      expect(screen.getByText('Create your first portfolio to start investing')).toBeInTheDocument()
    })
  })
  
  it('displays portfolios when available', async () => {
    const mockPortfolios = [
      {
        id: '1',
        name: 'ESG Growth',
        currency: 'USD',
        total_value: 10000,
        total_invested: 8000,
        total_returns: 2000,
        esg_score: 85,
        is_active: true,
        holdings_count: 5,
        last_transaction_at: null,
      },
      {
        id: '2',
        name: 'Tech Innovation',
        currency: 'USD',
        total_value: 5000,
        total_invested: 5500,
        total_returns: -500,
        esg_score: 70,
        is_active: false,
        holdings_count: 3,
        last_transaction_at: null,
      },
    ]
    
    mockUseSession.mockReturnValue({
      data: { user: { id: '123' }, expires: '' },
      status: 'authenticated' as const,
      update: jest.fn(),
    })
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ portfolios: mockPortfolios }),
    })
    
    render(<PortfoliosPage />)
    
    await waitFor(() => {
      expect(screen.getByText('ESG Growth')).toBeInTheDocument()
      expect(screen.getByText('Tech Innovation')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('$10,000')).toBeInTheDocument()
      expect(screen.getByText('$2,000')).toBeInTheDocument()
      expect(screen.getByText('$500')).toBeInTheDocument()
    })
  })
  
  it('creates a new portfolio', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '123' }, expires: '' },
      status: 'authenticated' as const,
      update: jest.fn(),
    })
    
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ portfolios: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          portfolio: {
            id: '3',
            name: 'New Portfolio',
            currency: 'USD',
            total_value: 0,
            total_invested: 0,
            total_returns: 0,
            esg_score: 0,
            is_active: false,
            holdings_count: 0,
            last_transaction_at: null,
          },
        }),
      })
    
    render(<PortfoliosPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Create Portfolio')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Create Portfolio'))
    
    const nameInput = screen.getByLabelText('Portfolio Name')
    fireEvent.change(nameInput, { target: { value: 'New Portfolio' } })
    
    const createButton = screen.getByRole('button', { name: 'Create Portfolio' })
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Portfolio created successfully')
    })
  })
  
  it('handles portfolio creation error', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '123' }, expires: '' },
      status: 'authenticated' as const,
      update: jest.fn(),
    })
    
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ portfolios: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Maximum portfolio limit reached' }),
      })
    
    render(<PortfoliosPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Create Portfolio')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Create Portfolio'))
    
    const nameInput = screen.getByLabelText('Portfolio Name')
    fireEvent.change(nameInput, { target: { value: 'New Portfolio' } })
    
    const createButton = screen.getByRole('button', { name: 'Create Portfolio' })
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Maximum portfolio limit reached')
    })
  })
})