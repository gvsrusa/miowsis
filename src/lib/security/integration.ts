/**
 * Security Integration Module
 * 
 * This module ensures all security features work together seamlessly
 * and provides unified interfaces for security operations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  validateCSRFToken, 
  getCSRFTokenFromRequest,
  withCSRFProtection 
} from './csrf'
import { 
  getUserRole, 
  hasRole, 
  checkRouteAccess,
  type UserRole 
} from '@/lib/rbac'
import { 
  SecurityContext, 
  requiresAuth, 
  requiresCSRF,
  isPublicEndpoint,
  getSecurityHeaders 
} from './security.config'
import { getCorsHeaders, isOriginAllowed } from '@/lib/config/cors'

// Unified security context for requests
export interface SecurityRequestContext {
  isAuthenticated: boolean
  userId?: string
  userEmail?: string
  userRole?: UserRole
  hasValidCSRF: boolean
  origin?: string
  isAllowedOrigin: boolean
  method: string
  pathname: string
}

/**
 * Perform comprehensive security checks for a request
 */
export async function performSecurityChecks(
  request: NextRequest
): Promise<{
  context: SecurityRequestContext
  passed: boolean
  error?: string
  statusCode?: number
}> {
  const { pathname } = request.nextUrl
  const method = request.method
  const origin = request.headers.get('origin') || undefined

  // Initialize security context
  const context: SecurityRequestContext = {
    isAuthenticated: false,
    hasValidCSRF: false,
    isAllowedOrigin: !origin || isOriginAllowed(origin),
    method,
    pathname,
    origin,
  }

  // Check if endpoint is public
  if (isPublicEndpoint(pathname)) {
    return { context, passed: true }
  }

  // Authentication check
  if (requiresAuth(pathname)) {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return {
        context,
        passed: false,
        error: 'Authentication required',
        statusCode: 401,
      }
    }

    context.isAuthenticated = true
    context.userId = session.user.id
    context.userEmail = session.user.email || undefined

    // Get user role if RBAC is enabled
    if (SecurityContext.features.RBAC_ENABLED) {
      const userRole = await getUserRole(session.user.id)
      if (userRole) {
        context.userRole = userRole
      }
    }
  }

  // CSRF check for state-changing operations
  if (requiresCSRF(method) && context.isAuthenticated && context.userId) {
    const csrfToken = getCSRFTokenFromRequest(request)
    
    if (!csrfToken) {
      return {
        context,
        passed: false,
        error: 'CSRF token missing',
        statusCode: 403,
      }
    }

    const isValidCSRF = await validateCSRFToken(context.userId, csrfToken)
    context.hasValidCSRF = isValidCSRF

    if (!isValidCSRF) {
      return {
        context,
        passed: false,
        error: 'Invalid CSRF token',
        statusCode: 403,
      }
    }
  }

  // CORS check
  if (SecurityContext.features.CORS_ENABLED && !context.isAllowedOrigin) {
    return {
      context,
      passed: false,
      error: 'Origin not allowed',
      statusCode: 403,
    }
  }

  // Route-based access control
  if (SecurityContext.features.RBAC_ENABLED && context.userId) {
    const access = await checkRouteAccess(pathname, context.userId)
    
    if (!access.hasAccess) {
      return {
        context,
        passed: false,
        error: access.reason || 'Access denied',
        statusCode: 403,
      }
    }
  }

  return { context, passed: true }
}

/**
 * Create a secured API route handler with all security features
 */
export function createSecuredHandler<T extends any[] = []>(
  options: {
    requireAuth?: boolean
    requireRoles?: UserRole[]
    requireCSRF?: boolean
    rateLimit?: number
  },
  handler: (
    request: NextRequest,
    context: SecurityRequestContext,
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Perform security checks
      const { context, passed, error, statusCode } = await performSecurityChecks(request)

      if (!passed) {
        return NextResponse.json(
          { error },
          { 
            status: statusCode || 400,
            headers: getSecurityHeaders(request.nextUrl.pathname)
          }
        )
      }

      // Additional role check if specified
      if (options.requireRoles && context.userRole) {
        if (!hasRole(context.userRole, options.requireRoles)) {
          return NextResponse.json(
            { 
              error: 'Insufficient permissions',
              required: options.requireRoles,
              current: context.userRole
            },
            { 
              status: 403,
              headers: getSecurityHeaders(request.nextUrl.pathname)
            }
          )
        }
      }

      // Execute the handler
      const response = await handler(request, context, ...args)

      // Add security headers
      const securityHeaders = getSecurityHeaders(request.nextUrl.pathname)
      const corsHeaders = getCorsHeaders(context.origin)

      Object.entries({ ...securityHeaders, ...corsHeaders }).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    } catch (error) {
      console.error('Security handler error:', error)
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { 
          status: 500,
          headers: getSecurityHeaders(request.nextUrl.pathname)
        }
      )
    }
  }
}

/**
 * Security middleware for Next.js middleware
 */
export async function applySecurityMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Add security headers
  const headers = getSecurityHeaders(pathname)
  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value)
    }
  })

  // Add request ID for tracking
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)

  // Log security events if audit logging is enabled
  if (SecurityContext.features.AUDIT_LOGGING) {
    // This would integrate with your logging system
    console.log('Security audit:', {
      requestId,
      method: request.method,
      pathname,
      timestamp: new Date().toISOString(),
    })
  }

  return response
}

/**
 * Client-side security helpers
 */
export const ClientSecurity = {
  /**
   * Add CSRF token to fetch options
   */
  addCSRFToken(options: RequestInit, token: string): RequestInit {
    return {
      ...options,
      headers: {
        ...options.headers,
        [SecurityContext.csrf.headerName]: token,
      },
    }
  },

  /**
   * Add authentication headers
   */
  addAuthHeaders(options: RequestInit, token?: string): RequestInit {
    if (!token) return options

    return {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    }
  },

  /**
   * Create secure fetch function
   */
  createSecureFetch(csrfToken?: string, authToken?: string) {
    return (url: string, options: RequestInit = {}) => {
      let secureOptions = { ...options }

      // Add CSRF token for state-changing requests
      if (csrfToken && requiresCSRF(options.method || 'GET')) {
        secureOptions = ClientSecurity.addCSRFToken(secureOptions, csrfToken)
      }

      // Add auth token if provided
      if (authToken) {
        secureOptions = ClientSecurity.addAuthHeaders(secureOptions, authToken)
      }

      // Ensure credentials are included
      secureOptions.credentials = 'include'

      return fetch(url, secureOptions)
    }
  },
}

/**
 * Hook for using security features in React components
 */
export function useSecurityContext() {
  // This would be implemented as a React hook
  // For now, return configuration
  return {
    features: SecurityContext.features,
    config: SecurityContext,
  }
}

// Export utility functions
export { performSecurityChecks as checkSecurity }
export { createSecuredHandler as secureHandler }
export { applySecurityMiddleware as securityMiddleware }
export { ClientSecurity as clientSecurity }