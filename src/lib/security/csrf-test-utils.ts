import { NextRequest } from 'next/server'
import { generateCSRFToken, storeCSRFToken, CSRF_CONFIG } from './csrf'

/**
 * Test utilities for CSRF protection
 */

/**
 * Create a mock request with CSRF token
 */
export async function createCSRFProtectedRequest(
  url: string,
  options: RequestInit & { userId?: string } = {}
): Promise<NextRequest> {
  const userId = options.userId || 'test-user-123'
  const csrfToken = generateCSRFToken()
  
  // Store the token for validation
  await storeCSRFToken(userId, csrfToken)
  
  // Create headers with CSRF token
  const headers = new Headers(options.headers)
  headers.set(CSRF_CONFIG.headerName, csrfToken)
  
  // Create the request
  const request = new NextRequest(url, {
    ...options,
    headers,
  })
  
  // Add CSRF cookie
  request.cookies.set(CSRF_CONFIG.cookieName, csrfToken)
  
  return request
}

/**
 * Mock session for testing
 */
export function mockSession(userId: string = 'test-user-123') {
  return {
    user: {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

/**
 * Helper to test CSRF-protected endpoints
 */
export async function testCSRFProtectedEndpoint(
  handler: (req: NextRequest) => Promise<Response>,
  options: {
    url: string
    method: string
    body?: any
    userId?: string
  }
) {
  // Test without CSRF token
  const unprotectedRequest = new NextRequest(options.url, {
    method: options.method,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  
  const unprotectedResponse = await handler(unprotectedRequest)
  
  // Test with CSRF token
  const protectedRequest = await createCSRFProtectedRequest(options.url, {
    method: options.method,
    body: options.body ? JSON.stringify(options.body) : undefined,
    userId: options.userId,
  })
  
  const protectedResponse = await handler(protectedRequest)
  
  return {
    withoutCSRF: {
      request: unprotectedRequest,
      response: unprotectedResponse,
    },
    withCSRF: {
      request: protectedRequest,
      response: protectedResponse,
    },
  }
}

/**
 * Generate test CSRF headers
 */
export function getTestCSRFHeaders(csrfToken: string): HeadersInit {
  return {
    [CSRF_CONFIG.headerName]: csrfToken,
    'Content-Type': 'application/json',
  }
}

/**
 * Example test usage:
 * 
 * ```typescript
 * import { testCSRFProtectedEndpoint } from '@/lib/security/csrf-test-utils'
 * import { POST } from '@/app/api/portfolios/route'
 * 
 * describe('Portfolio API', () => {
 *   it('should require CSRF token for POST requests', async () => {
 *     const results = await testCSRFProtectedEndpoint(POST, {
 *       url: 'http://localhost:3000/api/portfolios',
 *       method: 'POST',
 *       body: { name: 'Test Portfolio' },
 *     })
 *     
 *     // Without CSRF token should fail
 *     expect(results.withoutCSRF.response.status).toBe(403)
 *     
 *     // With CSRF token should succeed (or fail with different error)
 *     expect(results.withCSRF.response.status).not.toBe(403)
 *   })
 * })
 * ```
 */