import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// Mock service worker patterns from configuration
const navigateFallbackDenylist = [
  /\/api\/auth\/.*/,
  /\/auth\/.*/,
  /\/api\/.*/,
  /\/_next\/.*/,
]

// Helper function to check if URL should bypass service worker
function shouldBypassServiceWorker(url: string): boolean {
  return navigateFallbackDenylist.some(pattern => pattern.test(url))
}

describe('Service Worker Auth Route Handling', () => {
  describe('Route Exclusions', () => {
    it('should exclude NextAuth API routes', () => {
      const authRoutes = [
        '/api/auth/signin',
        '/api/auth/signout',
        '/api/auth/callback/google',
        '/api/auth/callback/github',
        '/api/auth/session',
        '/api/auth/csrf',
        '/api/auth/providers',
        '/api/auth/error'
      ]

      authRoutes.forEach(route => {
        expect(shouldBypassServiceWorker(route)).toBe(true)
      })
    })

    it('should exclude auth pages', () => {
      const authPages = [
        '/auth/signin',
        '/auth/signout',
        '/auth/error',
        '/auth/callback',
        '/auth/verify-request',
        '/auth/reset-password'
      ]

      authPages.forEach(page => {
        expect(shouldBypassServiceWorker(page)).toBe(true)
      })
    })

    it('should exclude all API routes', () => {
      const apiRoutes = [
        '/api/user',
        '/api/portfolio',
        '/api/market-data',
        '/api/health'
      ]

      apiRoutes.forEach(route => {
        expect(shouldBypassServiceWorker(route)).toBe(true)
      })
    })

    it('should exclude Next.js internal routes', () => {
      const nextRoutes = [
        '/_next/static/chunks/main.js',
        '/_next/data/build-id/index.json',
        '/_next/image?url=/logo.png'
      ]

      nextRoutes.forEach(route => {
        expect(shouldBypassServiceWorker(route)).toBe(true)
      })
    })

    it('should not exclude regular app routes', () => {
      const appRoutes = [
        '/',
        '/dashboard',
        '/portfolios',
        '/market',
        '/settings'
      ]

      appRoutes.forEach(route => {
        expect(shouldBypassServiceWorker(route)).toBe(false)
      })
    })
  })

  describe('OAuth Callback Handling', () => {
    it('should handle Google OAuth callback', () => {
      const googleCallback = '/api/auth/callback/google'
      expect(shouldBypassServiceWorker(googleCallback)).toBe(true)
    })

    it('should handle callback with query parameters', () => {
      const callbackWithParams = '/api/auth/callback/google?code=abc123&state=xyz789'
      expect(shouldBypassServiceWorker(callbackWithParams)).toBe(true)
    })

    it('should handle error callbacks', () => {
      const errorCallback = '/api/auth/callback/google?error=access_denied'
      expect(shouldBypassServiceWorker(errorCallback)).toBe(true)
    })
  })

  describe('Service Worker Registration', () => {
    // Import the utility function from sw-registration.js
    const shouldSkipServiceWorker = (url: string): boolean => {
      const authPatterns = [
        /\/auth\//,
        /\/api\/auth\//,
        /\/signin/,
        /\/signout/,
        /\/callback/,
        /supabase\.auth/
      ]
      
      return authPatterns.some(pattern => pattern.test(url))
    }

    it('should skip registration on auth routes', () => {
      const authUrls = [
        'http://localhost:3000/auth/signin',
        'http://localhost:3000/api/auth/callback/google',
        'https://app.example.com/auth/callback',
        'https://app.example.com/signin',
        'https://app.example.com/signout'
      ]

      authUrls.forEach(url => {
        expect(shouldSkipServiceWorker(url)).toBe(true)
      })
    })

    it('should skip Supabase auth URLs', () => {
      const supabaseUrls = [
        'https://project.supabase.auth.callback',
        'https://supabase.auth/verify',
        'http://localhost:3000/supabase.auth.callback'
      ]

      supabaseUrls.forEach(url => {
        expect(shouldSkipServiceWorker(url)).toBe(true)
      })
    })

    it('should allow registration on regular routes', () => {
      const regularUrls = [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/portfolios',
        'https://app.example.com/market'
      ]

      regularUrls.forEach(url => {
        expect(shouldSkipServiceWorker(url)).toBe(false)
      })
    })
  })

  describe('Cache Strategy', () => {
    it('should not cache auth responses', () => {
      // Auth routes should bypass SW entirely, so no caching
      const authRoute = '/api/auth/session'
      expect(shouldBypassServiceWorker(authRoute)).toBe(true)
    })

    it('should allow caching for static assets', () => {
      const staticAssets = [
        '/images/logo.png',
        '/fonts/inter.woff2',
        '/styles/main.css'
      ]

      staticAssets.forEach(asset => {
        expect(shouldBypassServiceWorker(asset)).toBe(false)
      })
    })
  })
})

// Integration test for middleware compatibility
describe('Middleware and Service Worker Integration', () => {
  it('should have consistent auth route definitions', () => {
    // These should match the publicRoutes in middleware.ts
    const middlewareAuthRoutes = [
      '/auth/signin',
      '/auth/signup',
      '/auth/callback',
      '/auth/reset-password',
      '/auth/error',
      '/auth/verify-request',
      '/auth/signout'
    ]

    // All middleware auth routes should bypass service worker
    middlewareAuthRoutes.forEach(route => {
      expect(shouldBypassServiceWorker(route)).toBe(true)
    })
  })
})