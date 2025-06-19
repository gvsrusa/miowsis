import { NextRequest, NextResponse } from 'next/server'
import {
  generateCSRFToken,
  storeCSRFToken,
  getCSRFToken,
  validateCSRFToken,
  getCSRFTokenFromRequest,
  setCSRFCookie,
  createOrRefreshCSRFToken,
  withCSRFProtection,
  CSRF_CONFIG,
} from '../csrf'
import { getServerSession } from 'next-auth'

// Mock next-auth
jest.mock('next-auth')
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

// Mock crypto.timingSafeEqual
Object.defineProperty(global.crypto, 'timingSafeEqual', {
  value: (a: ArrayBuffer, b: ArrayBuffer) => {
    const aBuf = Buffer.from(a)
    const bBuf = Buffer.from(b)
    return aBuf.length === bBuf.length && aBuf.equals(bBuf)
  },
  writable: true,
})

describe('CSRF Protection', () => {
  const mockSessionId = 'test-user-123'
  const mockSession = {
    user: {
      id: mockSessionId,
      email: 'test@example.com',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Clear token store by creating new tokens (internal map is cleared)
  })

  describe('Token Generation', () => {
    it('should generate a 64-character hex token', () => {
      const token = generateCSRFToken()
      expect(token).toHaveLength(64)
      expect(token).toMatch(/^[a-f0-9]+$/)
    })

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('Token Storage and Retrieval', () => {
    it('should store and retrieve a token', async () => {
      const token = generateCSRFToken()
      await storeCSRFToken(mockSessionId, token)
      
      const retrieved = await getCSRFToken(mockSessionId)
      expect(retrieved).toBe(token)
    })

    it('should return null for non-existent session', async () => {
      const retrieved = await getCSRFToken('non-existent')
      expect(retrieved).toBeNull()
    })

    it('should handle expired tokens', async () => {
      const token = generateCSRFToken()
      await storeCSRFToken(mockSessionId, token)
      
      // Mock expired token by manipulating Date.now
      const originalNow = Date.now
      Date.now = jest.fn(() => originalNow() + 2 * 60 * 60 * 1000) // 2 hours later
      
      const retrieved = await getCSRFToken(mockSessionId)
      expect(retrieved).toBeNull()
      
      Date.now = originalNow
    })
  })

  describe('Token Validation', () => {
    it('should validate correct token', async () => {
      const token = generateCSRFToken()
      await storeCSRFToken(mockSessionId, token)
      
      const isValid = await validateCSRFToken(mockSessionId, token)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect token', async () => {
      const token = generateCSRFToken()
      await storeCSRFToken(mockSessionId, token)
      
      const isValid = await validateCSRFToken(mockSessionId, 'wrong-token')
      expect(isValid).toBe(false)
    })

    it('should reject if no stored token', async () => {
      const isValid = await validateCSRFToken(mockSessionId, 'any-token')
      expect(isValid).toBe(false)
    })

    it('should use constant-time comparison', async () => {
      const token = generateCSRFToken()
      await storeCSRFToken(mockSessionId, token)
      
      // This test verifies the function uses crypto.timingSafeEqual
      const timingSafeEqualSpy = jest.spyOn(global.crypto, 'timingSafeEqual')
      await validateCSRFToken(mockSessionId, token)
      
      expect(timingSafeEqualSpy).toHaveBeenCalled()
    })
  })

  describe('Request Token Extraction', () => {
    it('should extract token from header', () => {
      const token = 'header-token'
      const headers = new Headers()
      headers.set('X-CSRF-Token', token)
      
      const request = new NextRequest('http://localhost/api/test', {
        headers,
      })
      
      const extracted = getCSRFTokenFromRequest(request)
      expect(extracted).toBe(token)
    })

    it('should extract token from cookie if no header', () => {
      const token = 'cookie-token'
      const request = new NextRequest('http://localhost/api/test')
      
      // Mock cookie
      Object.defineProperty(request, 'cookies', {
        value: {
          get: (name: string) => {
            if (name === CSRF_CONFIG.cookieName) {
              return { value: token }
            }
            return null
          },
        },
      })
      
      const extracted = getCSRFTokenFromRequest(request)
      expect(extracted).toBe(token)
    })

    it('should prioritize header over cookie', () => {
      const headerToken = 'header-token'
      const cookieToken = 'cookie-token'
      
      const headers = new Headers()
      headers.set('X-CSRF-Token', headerToken)
      
      const request = new NextRequest('http://localhost/api/test', {
        headers,
      })
      
      // Mock cookie
      Object.defineProperty(request, 'cookies', {
        value: {
          get: (name: string) => {
            if (name === CSRF_CONFIG.cookieName) {
              return { value: cookieToken }
            }
            return null
          },
        },
      })
      
      const extracted = getCSRFTokenFromRequest(request)
      expect(extracted).toBe(headerToken)
    })
  })

  describe('Cookie Management', () => {
    it('should set CSRF cookie with correct options', () => {
      const token = 'test-token'
      const response = new NextResponse()
      const setCookieSpy = jest.spyOn(response.cookies, 'set')
      
      setCSRFCookie(response, token)
      
      expect(setCookieSpy).toHaveBeenCalledWith({
        name: CSRF_CONFIG.cookieName,
        value: token,
        httpOnly: true,
        secure: false, // In test environment
        sameSite: 'lax',
        path: '/',
        maxAge: 3600, // 1 hour in seconds
      })
    })

    it('should set secure cookie in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const token = 'test-token'
      const response = new NextResponse()
      const setCookieSpy = jest.spyOn(response.cookies, 'set')
      
      setCSRFCookie(response, token)
      
      expect(setCookieSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: true,
        })
      )
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Token Creation/Refresh', () => {
    it('should create new token with expiration', async () => {
      const result = await createOrRefreshCSRFToken(mockSessionId)
      
      expect(result.token).toHaveLength(64)
      expect(result.expiresAt).toBeInstanceOf(Date)
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now())
      
      // Verify token was stored
      const stored = await getCSRFToken(mockSessionId)
      expect(stored).toBe(result.token)
    })
  })

  describe('CSRF Protection Middleware', () => {
    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    )
    const protectedHandler = withCSRFProtection(mockHandler)

    beforeEach(() => {
      mockHandler.mockClear()
    })

    it('should allow GET requests without CSRF check', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'GET',
      })
      
      const response = await protectedHandler(request, {})
      
      expect(mockHandler).toHaveBeenCalledWith(request, {})
      expect(response.status).toBe(200)
    })

    it('should allow HEAD requests without CSRF check', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'HEAD',
      })
      
      const response = await protectedHandler(request, {})
      
      expect(mockHandler).toHaveBeenCalledWith(request, {})
    })

    it('should require authentication for protected methods', async () => {
      mockGetServerSession.mockResolvedValueOnce(null)
      
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
      })
      
      const response = await protectedHandler(request, {})
      const body = await response.json()
      
      expect(response.status).toBe(401)
      expect(body.error).toBe('Unauthorized')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should require CSRF token for protected methods', async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession as any)
      
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
      })
      
      const response = await protectedHandler(request, {})
      const body = await response.json()
      
      expect(response.status).toBe(403)
      expect(body.error).toBe('CSRF token missing')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should validate CSRF token for protected methods', async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession as any)
      
      const token = generateCSRFToken()
      await storeCSRFToken(mockSessionId, token)
      
      const headers = new Headers()
      headers.set('X-CSRF-Token', 'wrong-token')
      
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers,
      })
      
      const response = await protectedHandler(request, {})
      const body = await response.json()
      
      expect(response.status).toBe(403)
      expect(body.error).toBe('Invalid CSRF token')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should allow request with valid CSRF token', async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession as any)
      
      const token = generateCSRFToken()
      await storeCSRFToken(mockSessionId, token)
      
      const headers = new Headers()
      headers.set('X-CSRF-Token', token)
      
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers,
      })
      
      const response = await protectedHandler(request, {})
      const body = await response.json()
      
      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(mockHandler).toHaveBeenCalledWith(request, {})
    })

    it('should handle errors gracefully', async () => {
      mockGetServerSession.mockRejectedValueOnce(new Error('Session error'))
      
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
      })
      
      const response = await protectedHandler(request, {})
      const body = await response.json()
      
      expect(response.status).toBe(500)
      expect(body.error).toBe('CSRF protection failed')
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('Constants Export', () => {
    it('should export correct configuration', () => {
      expect(CSRF_CONFIG.headerName).toBe('X-CSRF-Token')
      expect(CSRF_CONFIG.cookieName).toBe('csrf-token')
    })
  })
})