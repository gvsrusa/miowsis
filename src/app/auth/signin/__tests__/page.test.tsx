import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import SignInPage from '../page'
import { ReadonlyURLSearchParams } from 'next/navigation'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}))

// Mock next/link
jest.mock('next/link', () => {
  const MockedLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  MockedLink.displayName = 'MockedLink'
  return MockedLink
})

describe('SignInPage', () => {
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
  const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as unknown as ReadonlyURLSearchParams)
  })

  it('renders sign in page correctly', () => {
    render(<SignInPage />)

    expect(screen.getByText('Welcome to MIOwSIS')).toBeInTheDocument()
    expect(screen.getByText('Sign in to start your sustainable investment journey')).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByText('Sign in with Email')).toBeInTheDocument()
  })

  it('handles Google sign in', async () => {
    render(<SignInPage />)

    const googleButton = screen.getByText('Continue with Google')
    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/dashboard',
      })
    })
  })

  it('handles email sign in', async () => {
    render(<SignInPage />)

    const emailInput = screen.getByLabelText('Email')
    const submitButton = screen.getByText('Sign in with Email')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('email', {
        email: 'test@example.com',
        callbackUrl: '/dashboard',
      })
    })
  })

  it('uses custom callback URL from search params', async () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue('/custom-callback'),
    } as unknown as ReadonlyURLSearchParams)

    render(<SignInPage />)

    const googleButton = screen.getByText('Continue with Google')
    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/custom-callback',
      })
    })
  })

  it('disables buttons when loading', async () => {
    render(<SignInPage />)

    const googleButton = screen.getByText('Continue with Google')
    fireEvent.click(googleButton)

    // Check if buttons are disabled during loading
    expect(googleButton).toBeDisabled()
    expect(screen.getByLabelText('Email')).toBeDisabled()
    
    // The submit button text changes to "Signing in..." when loading
    const submitButton = screen.getByRole('button', { name: /signing in/i })
    expect(submitButton).toBeDisabled()
  })

  it('renders terms and privacy links', () => {
    render(<SignInPage />)

    expect(screen.getByText('Terms of Service')).toHaveAttribute('href', '/terms')
    expect(screen.getByText('Privacy Policy')).toHaveAttribute('href', '/privacy')
  })
})