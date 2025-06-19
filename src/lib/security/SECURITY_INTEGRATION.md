# Security Integration Documentation

## Overview

This document describes how all security features in MIOwSIS work together to provide comprehensive protection. The security system integrates multiple layers of defense including authentication, authorization, CSRF protection, CORS, and security headers.

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Request                         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Security Headers                           │
│  - X-Frame-Options, CSP, HSTS, etc.                         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      CORS Check                               │
│  - Origin validation                                          │
│  - Preflight handling                                         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Authentication                              │
│  - NextAuth JWT validation                                   │
│  - Supabase session check                                    │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   CSRF Protection                             │
│  - Token validation for state-changing requests              │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Role-Based Access Control                        │
│  - User role verification                                     │
│  - Route access validation                                    │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Logic                            │
└─────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. Authentication & CSRF Integration

The CSRF system is tightly integrated with authentication:

```typescript
// CSRF tokens are tied to authenticated sessions
const csrfToken = await createOrRefreshCSRFToken(session.user.id)

// CSRF validation requires authentication
if (requiresCSRF(method) && context.isAuthenticated) {
  // Validate CSRF token
}
```

**Key Points:**
- CSRF tokens are generated per user session
- Tokens are stored with user ID as the key
- CSRF protection only applies to authenticated requests
- Token refresh happens automatically before expiry

### 2. JWT & Role Integration

JWT tokens carry role information for efficient authorization:

```typescript
// JWT callback enriches token with user data
async jwt({ token, user, account }) {
  if (user) {
    token.id = user.id
    token.email = user.email
    // Role is fetched from database when needed
  }
  return token
}
```

**Key Points:**
- User ID in JWT enables role lookups
- Roles are fetched from database for accuracy
- Role hierarchy enables permission inheritance
- Admin > Moderator > Premium > User

### 3. Middleware Security Flow

The middleware orchestrates all security checks:

```typescript
// 1. Apply security headers
response = applySecurityMiddleware(request, response)

// 2. Check authentication (NextAuth + Supabase)
const isAuthenticated = hasNextAuthSession || supabaseAuth.isAuthenticated

// 3. Route protection
if (isProtectedRoute && !isAuthenticated) {
  return redirect('/auth/signin')
}

// 4. Role-based access
if (isAdminRoute) {
  const access = await checkRouteAccess(pathname, userId)
  if (!access.hasAccess) {
    return redirect(access.redirectPath)
  }
}
```

### 4. API Route Security

API routes use the unified security handler:

```typescript
export const GET = createSecuredHandler(
  {
    requireAuth: true,
    requireRoles: ['admin'],
    requireCSRF: false, // GET requests don't need CSRF
  },
  async (request, context) => {
    // context contains all security information
    const { userId, userRole, isAuthenticated } = context
    
    // Business logic here
    return NextResponse.json({ data })
  }
)
```

## Security Configuration

### Environment Variables

```env
# Authentication
NEXTAUTH_SECRET=<strong-secret>
NEXTAUTH_URL=https://yourdomain.com

# CSRF Protection
CSRF_TOKEN_EXPIRY=3600000 # 1 hour
CSRF_REFRESH_THRESHOLD=300000 # 5 minutes

# Security Headers
SECURITY_HEADERS_ENABLED=true
CSP_REPORT_URI=https://yourdomain.com/api/csp-report

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Features Toggle

Control security features via `security.config.ts`:

```typescript
export const SECURITY_FEATURES = {
  CSRF_PROTECTION: true,
  RBAC_ENABLED: true,
  CORS_ENABLED: true,
  SECURITY_HEADERS: true,
  JWT_ENCRYPTION: true,
  RATE_LIMITING: process.env.NODE_ENV === 'production',
  AUDIT_LOGGING: process.env.NODE_ENV === 'production',
}
```

## Client-Side Integration

### Using CSRF Protection

```typescript
import { useCSRF } from '@/hooks/use-csrf'

function MyComponent() {
  const { csrfToken, getHeaders } = useCSRF()
  
  const handleSubmit = async (data) => {
    const response = await fetch('/api/portfolios', {
      method: 'POST',
      headers: getHeaders(), // Includes CSRF token
      body: JSON.stringify(data),
    })
  }
}
```

### Secure Fetch Helper

```typescript
import { fetchWithCSRF } from '@/hooks/use-csrf'

// Automatically includes CSRF token for state-changing requests
const response = await fetchWithCSRF('/api/portfolios', {
  method: 'POST',
  body: JSON.stringify(data),
})
```

## Security Best Practices

### 1. API Route Protection

Always use the secured handler for protected routes:

```typescript
// ✅ Good - uses unified security
export const POST = createSecuredHandler(
  { requireAuth: true, requireCSRF: true },
  async (request, context) => {
    // Handler code
  }
)

// ❌ Bad - manual security checks
export async function POST(request) {
  const session = await getServerSession() // Missing CSRF!
  // Handler code
}
```

### 2. Role Checks

Use the role hierarchy system:

```typescript
// ✅ Good - uses role hierarchy
if (hasRole(userRole, ['moderator'])) {
  // User is moderator or admin
}

// ❌ Bad - direct role comparison
if (userRole === 'moderator') {
  // Misses admin users
}
```

### 3. CORS Configuration

Configure allowed origins properly:

```typescript
// Development includes common local origins
DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  /^https:\/\/.*\.github\.dev$/, // GitHub Codespaces
]

// Production uses explicit origins
PRODUCTION_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
]
```

## Security Monitoring

### Audit Logging

When enabled, security events are logged:

```typescript
// Logged events include:
- Authentication attempts (success/failure)
- CSRF token validation
- Role-based access denials
- API rate limit violations
- Suspicious request patterns
```

### Security Headers Monitoring

Monitor CSP violations:

```typescript
// CSP reports sent to configured endpoint
Content-Security-Policy-Report-Only: 
  default-src 'self'; 
  report-uri /api/csp-report
```

## Troubleshooting

### Common Issues

1. **CSRF Token Missing**
   - Ensure `useCSRF` hook is used in components
   - Check that cookies are enabled
   - Verify authentication is working

2. **Role Access Denied**
   - Check user's role in database
   - Verify role hierarchy configuration
   - Ensure Supabase connection is working

3. **CORS Errors**
   - Add origin to allowed list
   - Check preflight request handling
   - Verify API route CORS headers

### Debug Mode

Enable debug logging:

```typescript
// In development, security decisions are logged
if (process.env.NODE_ENV === 'development') {
  console.log('Security check:', {
    passed,
    context,
    error,
  })
}
```

## Security Checklist

- [ ] NEXTAUTH_SECRET is set and secure
- [ ] CSRF protection enabled for state-changing routes
- [ ] Role-based access configured for admin routes
- [ ] Security headers applied to all responses
- [ ] CORS origins properly configured
- [ ] Rate limiting enabled in production
- [ ] Audit logging configured
- [ ] CSP policy reviewed and tested
- [ ] JWT token expiry configured
- [ ] Session timeout settings appropriate

## Future Enhancements

1. **Two-Factor Authentication**
   - TOTP/SMS verification
   - WebAuthn support

2. **Advanced Rate Limiting**
   - Per-user limits
   - Distributed rate limiting with Redis

3. **Enhanced Audit Trail**
   - Detailed change tracking
   - Compliance reporting

4. **Security Dashboard**
   - Real-time threat monitoring
   - Security metrics visualization