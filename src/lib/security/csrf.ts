import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32
const CSRF_HEADER_NAME = 'X-CSRF-Token'
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour

// In-memory token store (for development - use Redis/DB in production)
const tokenStore = new Map<string, { token: string; expires: number }>()

export interface CSRFToken {
  token: string
  expiresAt: Date
}

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Store CSRF token for a session
 */
export async function storeCSRFToken(sessionId: string, token: string): Promise<void> {
  const expires = Date.now() + CSRF_TOKEN_EXPIRY
  tokenStore.set(sessionId, { token, expires })
  
  // Clean up expired tokens periodically
  cleanupExpiredTokens()
}

/**
 * Retrieve CSRF token for a session
 */
export async function getCSRFToken(sessionId: string): Promise<string | null> {
  const stored = tokenStore.get(sessionId)
  
  if (!stored) return null
  
  // Check if token is expired
  if (Date.now() > stored.expires) {
    tokenStore.delete(sessionId)
    return null
  }
  
  return stored.token
}

/**
 * Validate CSRF token
 */
export async function validateCSRFToken(sessionId: string, token: string): Promise<boolean> {
  const storedToken = await getCSRFToken(sessionId)
  
  if (!storedToken || !token) return false
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(storedToken),
    Buffer.from(token)
  )
}

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now()
  for (const [sessionId, data] of tokenStore.entries()) {
    if (now > data.expires) {
      tokenStore.delete(sessionId)
    }
  }
}

/**
 * Get CSRF token from request
 */
export function getCSRFTokenFromRequest(request: NextRequest): string | null {
  // Check header first (for AJAX requests)
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken) return headerToken
  
  // Check request body (for form submissions)
  // This would need to be parsed from the body in the actual route handler
  
  // Check cookie as fallback
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  return cookieToken || null
}

/**
 * Set CSRF token cookie
 */
export function setCSRFCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CSRF_TOKEN_EXPIRY / 1000, // Convert to seconds
  })
}

/**
 * Create or refresh CSRF token for a session
 */
export async function createOrRefreshCSRFToken(sessionId: string): Promise<CSRFToken> {
  const token = generateCSRFToken()
  await storeCSRFToken(sessionId, token)
  
  return {
    token,
    expiresAt: new Date(Date.now() + CSRF_TOKEN_EXPIRY),
  }
}

/**
 * Validate CSRF protection for a request
 * Use this at the beginning of your route handlers
 */
export async function validateCSRFProtection(
  request: NextRequest
): Promise<{ valid: boolean; error?: string; session?: any }> {
  // Skip CSRF protection for GET and HEAD requests
  if (request.method === 'GET' || request.method === 'HEAD') {
    return { valid: true }
  }
  
  try {
    // Get session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { valid: false, error: 'Unauthorized' }
    }
    
    // Get CSRF token from request
    const csrfToken = getCSRFTokenFromRequest(request)
    if (!csrfToken) {
      return { valid: false, error: 'CSRF token missing', session }
    }
    
    // Validate CSRF token
    const isValid = await validateCSRFToken(session.user.id, csrfToken)
    if (!isValid) {
      return { valid: false, error: 'Invalid CSRF token', session }
    }
    
    // Token is valid
    return { valid: true, session }
  } catch (error) {
    console.error('CSRF protection error:', error)
    return { valid: false, error: 'CSRF protection failed' }
  }
}

// Export constants for client-side use
export const CSRF_CONFIG = {
  headerName: CSRF_HEADER_NAME,
  cookieName: CSRF_COOKIE_NAME,
} as const