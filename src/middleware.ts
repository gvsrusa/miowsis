import { NextResponse, type NextRequest } from 'next/server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { checkRouteAccess } from './lib/rbac'
import type { Database } from './types/database.types'
import { logWarn, logError, logInfo } from './lib/monitoring/edge-logger'

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup', 
  '/auth/callback',
  '/auth/reset-password',
  '/auth/error',
  '/auth/verify-request',
  '/auth/signout',
  '/terms',
  '/privacy',
  '/contact',
  '/about',
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

// Removed checkAuthWithNextAuth - using only Supabase authentication now

async function checkAuthWithSupabase(request: NextRequest): Promise<{ 
  isAuthenticated: boolean, 
  user: { id: string; email?: string } | null, 
  session: { user: { id: string; email?: string } } | null 
}> {
  try {
    // Only proceed if Supabase credentials are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logWarn('Supabase credentials not available in middleware')
      return { isAuthenticated: false, user: null, session: null }
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
      logError(new Error('Supabase auth error in middleware'), { error })
      return { isAuthenticated: false, user: null, session: null }
    }

    if (session?.user) {
      logInfo('Authenticated user in middleware', { email: session.user.email })
    }

    return { 
      isAuthenticated: !!session?.user, 
      user: session?.user || null,
      session: session || null
    }
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Error checking Supabase auth'), { error })
    return { isAuthenticated: false, user: null, session: null }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Block all service worker related requests
  if (
    pathname.includes('/sw.js') ||
    pathname.includes('/workbox') ||
    pathname.includes('/service-worker') ||
    pathname === '/sw.js' ||
    pathname === '/service-worker.js' ||
    pathname.endsWith('.js.map') && pathname.includes('workbox')
  ) {
    // Return a script that unregisters service workers
    return new NextResponse(
      `
      // Service workers are disabled
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for(let registration of registrations) {
            registration.unregister();
          }
        });
      }
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Service-Worker-Allowed': '/',
        },
      }
    );
  }
  
  // Skip middleware for API routes that don't need auth
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Always allow public routes with cache prevention for auth routes
  if (isPublicRoute(pathname)) {
    if (pathname.includes('/auth/') || pathname.includes('/api/auth/')) {
      const response = NextResponse.next()
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check authentication using Supabase only
  const supabaseAuth = await checkAuthWithSupabase(request)
  const isAuthenticated = supabaseAuth.isAuthenticated

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

    // Check role access for admin routes using Supabase user
    if (supabaseAuth.isAuthenticated && supabaseAuth.user) {
      const userId = supabaseAuth.user.id
      
      try {
        const { hasAccess, redirectPath, reason } = await checkRouteAccess(pathname, userId)
        
        if (!hasAccess) {
          logWarn(`Access denied to ${pathname} for user ${userId}: ${reason}`, { pathname, userId, reason })
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
      } catch (error) {
        logError(error instanceof Error ? error : new Error('Error checking route access'), { error })
        return NextResponse.json(
          { error: 'Internal Error', message: 'Failed to check permissions' },
          { status: 500 }
        )
      }
    } else {
      // No valid user session for admin route
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      signInUrl.searchParams.set('error', 'SessionRequired')
      return NextResponse.redirect(signInUrl)
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

      // Refresh the session to ensure it's up to date
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Add user info to request headers for use in API routes
        response.headers.set('x-user-id', session.user.id)
        response.headers.set('x-user-email', session.user.email || '')
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error refreshing Supabase session'), { error })
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