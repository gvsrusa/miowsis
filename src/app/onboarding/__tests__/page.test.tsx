import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import OnboardingPage from '../page'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  redirect: jest.fn(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}))

describe('OnboardingPage', () => {
  const mockPush = jest.fn()
  const mockRouter = { push: mockPush }
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue(mockRouter as unknown as AppRouterInstance)
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '123',
          email: 'test@example.com',
        },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    })
  })

  describe('Step 1: Personal Information', () => {
    it('renders personal information form', () => {
      render(<OnboardingPage />)

      expect(screen.getByText('Welcome to MIOwSIS!')).toBeInTheDocument()
      expect(screen.getByText("Let's get to know you better")).toBeInTheDocument()
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument()
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
      expect(screen.getByText('Continue')).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      render(<OnboardingPage />)

      const continueButton = screen.getByText('Continue')
      fireEvent.click(continueButton)

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument()
        expect(screen.getByText('Date of birth is required')).toBeInTheDocument()
        expect(screen.getByText('Phone number is required')).toBeInTheDocument()
      })
    })

    it('proceeds to next step with valid data', async () => {
      render(<OnboardingPage />)

      fireEvent.change(screen.getByLabelText('Full Name'), {
        target: { value: 'John Doe' },
      })
      fireEvent.change(screen.getByLabelText('Date of Birth'), {
        target: { value: '1990-01-01' },
      })
      fireEvent.change(screen.getByLabelText('Phone Number'), {
        target: { value: '+1234567890' },
      })

      fireEvent.click(screen.getByText('Continue'))

      await waitFor(() => {
        expect(screen.getByText('Investment Profile')).toBeInTheDocument()
      })
    })
  })

  describe('Step 2: Investment Profile', () => {
    it('shows investment experience options', async () => {
      render(<OnboardingPage />)

      // Fill step 1
      fireEvent.change(screen.getByLabelText('Full Name'), {
        target: { value: 'John Doe' },
      })
      fireEvent.change(screen.getByLabelText('Date of Birth'), {
        target: { value: '1990-01-01' },
      })
      fireEvent.change(screen.getByLabelText('Phone Number'), {
        target: { value: '+1234567890' },
      })
      fireEvent.click(screen.getByText('Continue'))

      await waitFor(() => {
        expect(screen.getByText('What\'s your investment experience?')).toBeInTheDocument()
        expect(screen.getByText('Beginner')).toBeInTheDocument()
        expect(screen.getByText('Intermediate')).toBeInTheDocument()
        expect(screen.getByText('Advanced')).toBeInTheDocument()
        expect(screen.getByText('Expert')).toBeInTheDocument()
      })
    })
  })

  describe('Step 3: ESG Preferences', () => {
    it('shows ESG preference options', async () => {
      render(<OnboardingPage />)

      // Navigate to step 3
      await navigateToStep3()

      expect(screen.getByText('What matters most to you?')).toBeInTheDocument()
      expect(screen.getByText('Environmental Impact')).toBeInTheDocument()
      expect(screen.getByText('Social Responsibility')).toBeInTheDocument()
      expect(screen.getByText('Corporate Governance')).toBeInTheDocument()
    })
  })

  describe('Step 4: Risk Assessment', () => {
    it('shows risk tolerance options', async () => {
      render(<OnboardingPage />)

      // Navigate to step 4
      await navigateToStep4()

      expect(screen.getByText('How much risk are you comfortable with?')).toBeInTheDocument()
      expect(screen.getByText('Conservative')).toBeInTheDocument()
      expect(screen.getByText('Moderate')).toBeInTheDocument()
      expect(screen.getByText('Aggressive')).toBeInTheDocument()
    })
  })

  describe('Step 5: Account Setup', () => {
    it('completes onboarding and redirects to dashboard', async () => {
      render(<OnboardingPage />)

      // Navigate through all steps
      await navigateToStep5()

      // Complete final step
      fireEvent.click(screen.getByText('Start Investing'))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  // Helper functions
  async function navigateToStep3() {
    // Step 1
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '1990-01-01' },
    })
    fireEvent.change(screen.getByLabelText('Phone Number'), {
      target: { value: '+1234567890' },
    })
    fireEvent.click(screen.getByText('Continue'))

    // Step 2 - clicking experience level directly proceeds to next step
    await waitFor(() => screen.getByText('Beginner'))
    fireEvent.click(screen.getByText('Beginner'))

    await waitFor(() => screen.getByText('What matters most to you?'))
  }

  async function navigateToStep4() {
    await navigateToStep3()

    // Step 3
    const environmentalCheckbox = screen.getByRole('checkbox', {
      name: /environmental impact/i,
    })
    fireEvent.click(environmentalCheckbox)
    fireEvent.click(screen.getByText('Continue'))

    await waitFor(() => screen.getByText('How much risk are you comfortable with?'))
  }

  async function navigateToStep5() {
    await navigateToStep4()

    // Step 4 - clicking risk level directly proceeds to next step
    fireEvent.click(screen.getByText('Moderate'))

    await waitFor(() => screen.getByText('All set!'))
  }
})