import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import DashboardPage from '../page'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table) => {
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: '123',
                  full_name: 'John Doe',
                  onboarding_completed: true,
                },
                error: null,
              }),
            })),
          })),
        }
      }
      if (table === 'portfolios') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: '123',
                    user_id: '123',
                    name: 'My Portfolio',
                    total_value: 10000,
                    total_invested: 8000,
                    total_returns: 2000,
                    esg_score: 85,
                  },
                  error: null,
                }),
              })),
            })),
          })),
        }
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      }
    }),
  })),
}))

// Mock react-grid-layout to avoid layout calculation errors in tests
jest.mock('react-grid-layout', () => ({
  WidthProvider: (Component: React.ComponentType) => Component,
  Responsive: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('DashboardPage', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
  const mockRedirect = redirect as jest.MockedFunction<typeof redirect>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading skeleton when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    })

    render(<DashboardPage />)

    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('redirects to signin when user is not authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<DashboardPage />)

    // Wait a moment for the redirect to be called
    await waitFor(() => {
      expect(mockRedirect).toHaveBeenCalledWith('/auth/signin')
    })
  })

  it('shows loading skeleton while fetching data', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'John Doe',
        },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<DashboardPage />)

    // Initially shows skeleton while loading
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('displays welcome message after data loads', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'John Doe',
        },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<DashboardPage />)

    // Wait for the welcome message to appear
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
    })
  })
})