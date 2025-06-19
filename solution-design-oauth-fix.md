# OAuth Flow Fix - Solution Design

## Problem Summary
- Google sign-in returns 404 error
- Whitelabel error page appears instead of custom error views
- OAuth redirect URI configuration issues
- Incomplete error handling in authentication flow

## Solution Components

### 1. OAuth Redirect URI Configuration

#### Google Console Configuration
```
Authorized redirect URIs:
- http://localhost:3000/api/auth/callback/google (development)
- https://yourdomain.com/api/auth/callback/google (production)
- http://127.0.0.1:3000/api/auth/callback/google (local dev alternative)
```

#### Environment Variable Updates
```env
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 2. Custom Error Page Implementation

#### A. Global Error Boundary (app/error.tsx)
```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log error to monitoring service
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {error.message || 'Unknown error'}
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/')}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => reset()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  )
}
```

#### B. OAuth Callback Handler (app/api/auth/callback/google/route.ts)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const error = searchParams.get('error')
    const code = searchParams.get('code')
    
    // Handle OAuth errors
    if (error) {
      console.error('OAuth callback error:', error)
      
      const errorMap: Record<string, string> = {
        'access_denied': 'AccessDenied',
        'unauthorized_client': 'Configuration',
        'invalid_request': 'OAuthCallback',
        'unsupported_response_type': 'Configuration',
        'invalid_scope': 'Configuration',
        'server_error': 'OAuthCallback',
        'temporarily_unavailable': 'OAuthCallback'
      }
      
      const authError = errorMap[error] || 'OAuthCallback'
      return NextResponse.redirect(
        new URL(`/auth/error?error=${authError}`, request.url)
      )
    }
    
    // Handle missing authorization code
    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/error?error=OAuthCallback', request.url)
      )
    }
    
    // NextAuth will handle the actual OAuth flow
    // This is just for error catching
    return NextResponse.next()
    
  } catch (error) {
    console.error('OAuth callback handler error:', error)
    return NextResponse.redirect(
      new URL('/auth/error?error=OAuthCallback', request.url)
    )
  }
}
```

### 3. Enhanced Middleware Error Handling

#### Updated Middleware (src/middleware.ts additions)
```typescript
// Add to the middleware function
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  
  // Handle OAuth callback errors specifically
  if (pathname.startsWith('/api/auth/callback/')) {
    const error = searchParams.get('error')
    if (error) {
      // Redirect to custom error page instead of showing 404
      const errorUrl = new URL('/auth/error', request.url)
      errorUrl.searchParams.set('error', 'OAuthCallback')
      errorUrl.searchParams.set('details', error)
      return NextResponse.redirect(errorUrl)
    }
  }
  
  // ... rest of existing middleware
}
```

### 4. OAuth Success/Failure Handlers

#### A. Success Handler Component
```typescript
// app/auth/callback/success/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

export default function AuthSuccessPage() {
  const router = useRouter()
  const { data: session } = useSession()
  
  useEffect(() => {
    if (session) {
      // Redirect to dashboard or onboarding
      const redirectTo = session.user?.isNewUser ? '/onboarding' : '/dashboard'
      const timer = setTimeout(() => {
        router.push(redirectTo)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [session, router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back!</CardTitle>
          <CardDescription>
            You've successfully signed in. Redirecting you to your dashboard...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### B. OAuth Configuration Validator
```typescript
// lib/auth-oauth-validator.ts
export function validateOAuthConfig() {
  const requiredEnvVars = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  }
  
  const missing = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)
  
  if (missing.length > 0) {
    console.error('Missing OAuth configuration:', missing.join(', '))
    return false
  }
  
  // Validate NEXTAUTH_URL format
  try {
    const url = new URL(requiredEnvVars.NEXTAUTH_URL!)
    if (!url.protocol || !url.host) {
      console.error('Invalid NEXTAUTH_URL format')
      return false
    }
  } catch (error) {
    console.error('Invalid NEXTAUTH_URL:', error)
    return false
  }
  
  return true
}
```

### 5. NextAuth Configuration Updates

#### Enhanced auth.ts
```typescript
// Add to src/lib/auth.ts

import { validateOAuthConfig } from './auth-oauth-validator'

// Validate OAuth configuration on startup
if (process.env.NODE_ENV === 'development') {
  if (!validateOAuthConfig()) {
    console.error('⚠️  OAuth configuration validation failed')
  }
}

// Update GoogleProvider configuration
if (hasValidGoogleCredentials()) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        prompt: "consent",
        access_type: "offline",
        response_type: "code"
      }
    },
    // Add explicit checks
    checks: ['pkce', 'state'],
  }))
  console.log('✅ Google OAuth provider enabled')
  console.log('   Redirect URI:', `${process.env.NEXTAUTH_URL}/api/auth/callback/google`)
}

// Update callbacks
callbacks: {
  async signIn({ user, account, profile }) {
    // Enhanced OAuth sign-in validation
    if (account?.provider === 'google') {
      if (!profile?.email_verified) {
        console.error('Google account email not verified')
        return '/auth/error?error=EmailNotVerified'
      }
    }
    
    // Log successful OAuth sign-ins
    console.log(`OAuth sign-in: ${account?.provider} - ${user.email}`)
    return true
  },
  
  async redirect({ url, baseUrl }) {
    // Ensure OAuth callbacks redirect properly
    if (url.startsWith('/api/auth/callback/')) {
      return `${baseUrl}/auth/callback/success`
    }
    
    // Redirect to dashboard after sign-in
    if (url === baseUrl || url === `${baseUrl}/`) {
      return `${baseUrl}/dashboard`
    }
    
    // Allow relative URLs
    if (url.startsWith('/')) return `${baseUrl}${url}`
    
    // Allow URLs on the same origin
    if (new URL(url).origin === baseUrl) return url
    
    return baseUrl
  },
}
```

### 6. Security Filter Chain Updates

#### CORS Configuration for OAuth
```typescript
// Add to next.config.ts headers
{
  source: "/api/auth/callback/:provider",
  headers: [
    {
      key: "X-Frame-Options",
      value: "SAMEORIGIN" // Allow OAuth providers to load in iframes
    },
    {
      key: "Content-Security-Policy",
      value: "frame-ancestors 'self' https://accounts.google.com"
    }
  ]
}
```

## Implementation Checklist

1. **Environment Configuration**
   - [ ] Update .env.local with proper NEXTAUTH_URL
   - [ ] Verify Google OAuth credentials
   - [ ] Set NEXTAUTH_SECRET for production

2. **Google Console Setup**
   - [ ] Add all redirect URIs (localhost, production)
   - [ ] Enable Google+ API if not already enabled
   - [ ] Verify OAuth consent screen configuration

3. **Code Implementation**
   - [ ] Create app/error.tsx global error boundary
   - [ ] Update src/middleware.ts with OAuth error handling
   - [ ] Create OAuth success page
   - [ ] Add OAuth configuration validator
   - [ ] Update auth.ts with enhanced error handling

4. **Testing**
   - [ ] Test Google sign-in flow in development
   - [ ] Test error scenarios (cancel, denied access)
   - [ ] Verify error pages display correctly
   - [ ] Test redirect URIs work properly

5. **Monitoring**
   - [ ] Add logging for OAuth errors
   - [ ] Monitor 404 errors in production
   - [ ] Track successful OAuth sign-ins

## Security Considerations

1. **State Parameter**: NextAuth handles CSRF protection with state parameter
2. **PKCE**: Enabled for additional OAuth security
3. **Email Verification**: Check Google account email is verified
4. **Redirect Validation**: Strict redirect URL validation to prevent open redirects

## Migration Path

1. Deploy error pages first (non-breaking)
2. Update environment variables
3. Deploy middleware updates
4. Update Google Console redirect URIs
5. Monitor for 24 hours
6. Remove old error handling code

This solution provides comprehensive error handling, proper OAuth flow management, and replaces whitelabel error pages with custom Next.js error views.