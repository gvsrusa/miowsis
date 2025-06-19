import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createOrRefreshCSRFToken, setCSRFCookie } from '@/lib/security/csrf'

/**
 * CSRF middleware for Next.js
 * Automatically generates CSRF tokens for authenticated users
 */
export async function csrfMiddleware(request: NextRequest) {
  // Skip for API routes that don't need CSRF
  const pathname = request.nextUrl.pathname
  
  // Skip CSRF generation for public paths
  const publicPaths = ['/auth/signin', '/auth/signup', '/api/auth/session']
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  try {
    // Get the session token
    const token = await getToken({ req: request })
    
    if (token?.sub) {
      // Check if user already has a CSRF token
      const existingToken = request.cookies.get('csrf-token')?.value
      
      // Only generate new token if one doesn't exist or on dashboard/main pages
      if (!existingToken && pathname === '/dashboard') {
        const { token: csrfToken } = await createOrRefreshCSRFToken(token.sub)
        
        // Create response and set cookie
        const response = NextResponse.next()
        setCSRFCookie(response, csrfToken)
        
        return response
      }
    }
  } catch (error) {
    console.error('CSRF middleware error:', error)
  }
  
  return NextResponse.next()
}

/**
 * Configuration for CSRF-protected routes
 */
export const csrfConfig = {
  // Routes that require CSRF protection
  protectedRoutes: [
    '/api/portfolios',
    '/api/transactions',
    '/api/settings',
    '/api/profile',
  ],
  
  // Methods that require CSRF protection
  protectedMethods: ['POST', 'PUT', 'DELETE', 'PATCH'],
  
  // Check if a route requires CSRF protection
  requiresProtection(pathname: string, method: string): boolean {
    const requiresMethod = this.protectedMethods.includes(method.toUpperCase())
    const requiresRoute = this.protectedRoutes.some(route => pathname.startsWith(route))
    
    return requiresMethod && requiresRoute
  }
}