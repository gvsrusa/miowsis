import { NextResponse, type NextRequest } from 'next/server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { checkRouteAccess } from './lib/rbac'
import type { Database } from './types/database.types'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup', 
  '/auth/error',
  '/auth/verify-request',
  '/auth/signout',
  '/terms',
  '/privacy',
  '/contact',
  '/about',
  '/api/auth',
  '/api/health'
]

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/portfolios',
  '/market',
  '/achievements', 
  '/ai-assistant',
  '/settings',
  '/profile',
  '/onboarding'
]

// Define admin routes that require admin role
const adminRoutes = [
  '/admin'
]

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route === '/') return pathname === route
    if (route === '/api/auth') return pathname.startsWith(route)
    return pathname.startsWith(route)
  })
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route))
}

function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(route => pathname.startsWith(route))
}

async function checkAuthWithNextAuth(request: NextRequest): Promise<boolean> {
  // Check NextAuth session token
  const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                      request.cookies.get('__Secure-next-auth.session-token')?.value
  
  if (!sessionToken) return false
  
  // For a more robust check, you could verify the JWT token here
  // For now, we'll trust the presence of the session token
  return true
}

async function checkAuthWithSupabase(request: NextRequest): Promise<{ isAuthenticated: boolean, user: any }> {
  try {
    // Only proceed if Supabase credentials are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return { isAuthenticated: false, user: null }
    }

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set() {}, // No-op for middleware
          remove() {}, // No-op for middleware
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Supabase auth error in middleware:', error)
      return { isAuthenticated: false, user: null }
    }

    return { 
      isAuthenticated: !!session?.user, 
      user: session?.user || null 
    }
  } catch (error) {
    console.error('Error checking Supabase auth:', error)
    return { isAuthenticated: false, user: null }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  
  // Skip middleware for API routes that don't need auth
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Always allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check authentication using both NextAuth and Supabase
  const [hasNextAuthSession, supabaseAuth] = await Promise.all([
    checkAuthWithNextAuth(request),
    checkAuthWithSupabase(request)
  ])

  const isAuthenticated = hasNextAuthSession || supabaseAuth.isAuthenticated

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      signInUrl.searchParams.set('error', 'SessionRequired')
      return NextResponse.redirect(signInUrl)
    }
  }

  // Handle admin routes with role checking
  if (isAdminRoute(pathname)) {
    if (!isAuthenticated) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      signInUrl.searchParams.set('error', 'SessionRequired')
      return NextResponse.redirect(signInUrl)
    }

    // Check role access for admin routes
    let userId: string | null = null
    
    // Try to get user ID from NextAuth session
    const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
                        request.cookies.get('__Secure-next-auth.session-token')?.value
    
    // If NextAuth session exists, we'll use it (you might need to decode JWT to get user ID)
    // For now, we'll use Supabase auth if available
    if (supabaseAuth.isAuthenticated && supabaseAuth.user) {
      userId = supabaseAuth.user.id
    }
    
    if (userId) {
      const { hasAccess, redirectPath, reason } = await checkRouteAccess(pathname, userId)
      
      if (!hasAccess) {
        console.warn(`Access denied to ${pathname} for user ${userId}: ${reason}`)
        if (redirectPath) {
          const redirectUrl = new URL(redirectPath, request.url)
          redirectUrl.searchParams.set('error', 'AccessDenied')
          redirectUrl.searchParams.set('reason', reason || 'Insufficient permissions')
          return NextResponse.redirect(redirectUrl)
        } else {
          return NextResponse.json(
            { error: 'Access Denied', message: reason || 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }
    }
  }

  // Refresh Supabase session for authenticated requests
  if (isAuthenticated && supabaseAuth.isAuthenticated) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value,
                ...options,
              })
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              })
              response.cookies.set({
                name,
                value,
                ...options,
              })
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value: '',
                ...options,
              })
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              })
              response.cookies.set({
                name,
                value: '',
                ...options,
              })
            },
          },
        }
      )

      await supabase.auth.getSession()
    } catch (error) {
      console.error('Error refreshing Supabase session:', error)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}