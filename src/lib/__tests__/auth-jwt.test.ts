import { authOptions } from '../auth'
import { getServerSession } from 'next-auth'
import jwt from 'jsonwebtoken'
import { getUserRole } from '../rbac'

// Mock dependencies
jest.mock('next-auth')
jest.mock('../rbac')
jest.mock('jsonwebtoken')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockGetUserRole = getUserRole as jest.MockedFunction<typeof getUserRole>
const mockJwt = jwt as jest.Mocked<typeof jwt>

describe('JWT and Session Configuration', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  }

  const mockAccount = {
    provider: 'email',
    type: 'email' as const,
    providerAccountId: 'test@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Session Configuration', () => {
    it('should have correct session strategy', () => {
      expect(authOptions.session?.strategy).toBe('jwt')
    })

    it('should have 30-day session maxAge', () => {
      expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60) // 30 days in seconds
    })

    it('should update session every 24 hours', () => {
      expect(authOptions.session?.updateAge).toBe(24 * 60 * 60) // 24 hours in seconds
    })
  })

  describe('JWT Configuration', () => {
    it('should have 30-day JWT maxAge', () => {
      expect(authOptions.jwt?.maxAge).toBe(30 * 24 * 60 * 60) // 30 days in seconds
    })
  })

  describe('JWT Callback', () => {
    const jwtCallback = authOptions.callbacks?.jwt

    it('should add user info to token on sign in', async () => {
      mockGetUserRole.mockResolvedValueOnce('admin')

      const token = {}
      const result = await jwtCallback!({ 
        token, 
        user: mockUser,
        account: mockAccount,
        trigger: 'signIn',
        isNewUser: false,
        session: undefined,
      })

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: 'admin',
        provider: 'email',
      })
      expect(mockGetUserRole).toHaveBeenCalledWith(mockUser.id)
    })

    it('should preserve existing token data', async () => {
      const existingToken = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        provider: 'email',
      }

      const result = await jwtCallback!({ 
        token: existingToken,
        user: undefined,
        account: undefined,
        trigger: undefined,
        isNewUser: false,
        session: undefined,
      })

      expect(result).toEqual(existingToken)
      expect(mockGetUserRole).not.toHaveBeenCalled()
    })

    it('should handle null user role', async () => {
      mockGetUserRole.mockResolvedValueOnce(null)

      const token = {}
      const result = await jwtCallback!({ 
        token, 
        user: mockUser,
        account: mockAccount,
        trigger: 'signIn',
        isNewUser: false,
        session: undefined,
      })

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: null,
        provider: 'email',
      })
    })
  })

  describe('Session Callback', () => {
    const sessionCallback = authOptions.callbacks?.session

    it('should add token data to session', async () => {
      const token = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        provider: 'email',
      }

      const session = {
        user: {
          email: 'test@example.com',
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      const result = await sessionCallback!({ 
        session, 
        token,
        user: undefined,
        newSession: undefined,
        trigger: 'update',
      })

      expect(result.user).toEqual({
        email: 'test@example.com',
        id: 'user-123',
        role: 'admin',
      })
    })

    it('should add provider info in development', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const token = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        provider: 'google',
      }

      const session = {
        user: {
          email: 'test@example.com',
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      const result = await sessionCallback!({ 
        session, 
        token,
        user: undefined,
        newSession: undefined,
        trigger: 'update',
      })

      expect((result as any).provider).toBe('google')

      process.env.NODE_ENV = originalEnv
    })

    it('should not add provider info in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const token = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        provider: 'google',
      }

      const session = {
        user: {
          email: 'test@example.com',
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      const result = await sessionCallback!({ 
        session, 
        token,
        user: undefined,
        newSession: undefined,
        trigger: 'update',
      })

      expect((result as any).provider).toBeUndefined()

      process.env.NODE_ENV = originalEnv
    })

    it('should handle missing token data', async () => {
      const session = {
        user: {
          email: 'test@example.com',
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      const result = await sessionCallback!({ 
        session, 
        token: null as any,
        user: undefined,
        newSession: undefined,
        trigger: 'update',
      })

      expect(result).toEqual(session)
    })
  })

  describe('SignIn Callback', () => {
    const signInCallback = authOptions.callbacks?.signIn

    it('should allow email sign in with email address', async () => {
      const result = await signInCallback!({
        user: { ...mockUser, email: 'test@example.com' },
        account: { ...mockAccount, provider: 'email' },
        email: { verificationRequest: false },
        credentials: undefined,
        profile: undefined,
      })

      expect(result).toBe(true)
    })

    it('should reject email sign in without email address', async () => {
      const result = await signInCallback!({
        user: { ...mockUser, email: null },
        account: { ...mockAccount, provider: 'email' },
        email: { verificationRequest: false },
        credentials: undefined,
        profile: undefined,
      })

      expect(result).toBe(false)
    })

    it('should allow non-email providers', async () => {
      const result = await signInCallback!({
        user: mockUser,
        account: { ...mockAccount, provider: 'google' },
        email: undefined,
        credentials: undefined,
        profile: undefined,
      })

      expect(result).toBe(true)
    })
  })

  describe('Page Configuration', () => {
    it('should have custom auth pages configured', () => {
      expect(authOptions.pages).toEqual({
        signIn: '/auth/signin',
        signOut: '/auth/signout',
        error: '/auth/error',
        verifyRequest: '/auth/verify-request',
        newUser: '/onboarding',
      })
    })
  })

  describe('Debug Mode', () => {
    it('should enable debug in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      // Re-import to get fresh config
      jest.resetModules()
      const { authOptions: devAuthOptions } = require('../auth')
      
      expect(devAuthOptions.debug).toBe(true)
      
      process.env.NODE_ENV = originalEnv
    })

    it('should disable debug in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      // Re-import to get fresh config
      jest.resetModules()
      const { authOptions: prodAuthOptions } = require('../auth')
      
      expect(prodAuthOptions.debug).toBe(false)
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('JWT Token Expiration', () => {
    it('should verify JWT expiration is enforced', () => {
      // The JWT maxAge configuration ensures tokens expire after 30 days
      const maxAgeInSeconds = authOptions.jwt?.maxAge
      const maxAgeInDays = maxAgeInSeconds! / (24 * 60 * 60)
      
      expect(maxAgeInDays).toBe(30)
    })

    it('should have session expire at same time as JWT', () => {
      const jwtMaxAge = authOptions.jwt?.maxAge
      const sessionMaxAge = authOptions.session?.maxAge
      
      expect(jwtMaxAge).toBe(sessionMaxAge)
      expect(jwtMaxAge).toBe(30 * 24 * 60 * 60)
    })

    it('should refresh session data every 24 hours', () => {
      const updateAge = authOptions.session?.updateAge
      const updateAgeInHours = updateAge! / (60 * 60)
      
      expect(updateAgeInHours).toBe(24)
    })
  })
})