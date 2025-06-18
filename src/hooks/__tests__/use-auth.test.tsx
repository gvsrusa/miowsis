import { renderHook, act } from '@testing-library/react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useAuth } from '../use-auth'

// Mock next-auth/react
jest.mock('next-auth/react')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}))

describe('useAuth', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
  const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return unauthenticated state when no session exists', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeUndefined()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('should return authenticated state when session exists', () => {
    const mockSession = {
      user: {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      },
      expires: new Date().toISOString(),
    }

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toEqual(mockSession.user)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('should return loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeUndefined()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(true)
  })

  it('should call signIn with provider when login is called', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login('google')
    })

    expect(mockSignIn).toHaveBeenCalledWith('google', {
      callbackUrl: '/dashboard',
    })
  })

  it('should use default provider when login is called without provider', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login()
    })

    expect(mockSignIn).toHaveBeenCalledWith('google', {
      callbackUrl: '/dashboard',
    })
  })

  it('should call signOut when logout is called', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '123', email: 'test@example.com' },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.logout()
    })

    expect(mockSignOut).toHaveBeenCalledWith({
      callbackUrl: '/',
    })
  })

  it('should handle login errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    mockSignIn.mockRejectedValue(new Error('Login failed'))

    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login()
    })

    expect(consoleError).toHaveBeenCalledWith('Login error:', expect.any(Error))
    consoleError.mockRestore()
  })

  it('should handle logout errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    mockSignOut.mockRejectedValue(new Error('Logout failed'))

    mockUseSession.mockReturnValue({
      data: {
        user: { id: '123', email: 'test@example.com' },
        expires: new Date().toISOString(),
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.logout()
    })

    expect(consoleError).toHaveBeenCalledWith('Logout error:', expect.any(Error))
    consoleError.mockRestore()
  })
})