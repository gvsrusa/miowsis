# Security Migration Guide

This guide shows how to update existing API routes to use the integrated security system.

## Before (Current Implementation)

```typescript
// src/app/api/portfolios/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Business logic...
  } catch (error) {
    // Error handling...
  }
}
```

## After (With Integrated Security)

```typescript
// src/app/api/portfolios/route.ts
import { createSecuredHandler } from '@/lib/security/integration'

export const POST = createSecuredHandler(
  {
    requireAuth: true,
    requireCSRF: true,
    requireRoles: ['user'], // All authenticated users
  },
  async (request, context) => {
    const { userId, userRole } = context
    
    // Business logic with guaranteed authentication
    // CSRF protection is automatic
    // Security headers are applied
  }
)
```

## Migration Steps

### 1. Update API Routes

Replace manual auth checks with `createSecuredHandler`:

```typescript
// Old way
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return unauthorized()
  
  // Manual CSRF check needed
  // Manual role check needed
  // Manual headers needed
}

// New way
export const DELETE = createSecuredHandler(
  {
    requireAuth: true,
    requireCSRF: true,
    requireRoles: ['admin'],
  },
  async (request, context) => {
    // Everything is validated
  }
)
```

### 2. Update Client Components

Use the CSRF hook for mutations:

```typescript
// Old way
const response = await fetch('/api/portfolios', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})

// New way
import { useCSRF } from '@/hooks/use-csrf'

const { getHeaders } = useCSRF()
const response = await fetch('/api/portfolios', {
  method: 'POST',
  headers: getHeaders(),
  body: JSON.stringify(data),
})
```

### 3. Update Middleware

The current middleware already handles most security, but can be enhanced:

```typescript
// Add to src/middleware.ts
import { applySecurityMiddleware } from '@/lib/security/integration'

export async function middleware(request: NextRequest) {
  // Existing logic...
  
  // Apply security enhancements
  response = await applySecurityMiddleware(request, response)
  
  return response
}
```

### 4. Role-Based UI

Show/hide UI elements based on roles:

```typescript
// Create a role context provider
import { useSession } from 'next-auth/react'
import { getUserRole } from '@/lib/rbac'

function RoleProvider({ children }) {
  const { data: session } = useSession()
  const [userRole, setUserRole] = useState(null)
  
  useEffect(() => {
    if (session?.user?.id) {
      getUserRole(session.user.id).then(setUserRole)
    }
  }, [session])
  
  return (
    <RoleContext.Provider value={{ userRole }}>
      {children}
    </RoleContext.Provider>
  )
}

// Use in components
function AdminPanel() {
  const { userRole } = useRole()
  
  if (!hasRole(userRole, ['admin'])) {
    return null
  }
  
  return <div>Admin content</div>
}
```

## Quick Reference

### API Route Security Options

```typescript
createSecuredHandler({
  // Authentication
  requireAuth: true,              // Require authenticated user
  
  // CSRF Protection
  requireCSRF: true,              // Require valid CSRF token
  
  // Role-Based Access
  requireRoles: ['admin'],        // Required roles (uses hierarchy)
  
  // Rate Limiting (future)
  rateLimit: 100,                // Max requests per window
})
```

### Security Context Properties

```typescript
interface SecurityRequestContext {
  // Authentication
  isAuthenticated: boolean
  userId?: string
  userEmail?: string
  
  // Authorization
  userRole?: UserRole
  
  // Security
  hasValidCSRF: boolean
  
  // Request Info
  origin?: string
  isAllowedOrigin: boolean
  method: string
  pathname: string
}
```

### Environment Variables

Required for full security:

```env
NEXTAUTH_SECRET=<generated-secret>
CSRF_TOKEN_EXPIRY=3600000
RATE_LIMIT_ENABLED=true
SECURITY_HEADERS_ENABLED=true
```

## Testing Security

### 1. Test Authentication

```typescript
// Without auth - should fail
const response = await fetch('/api/portfolios', {
  method: 'POST',
})
expect(response.status).toBe(401)
```

### 2. Test CSRF

```typescript
// Without CSRF token - should fail
const response = await fetch('/api/portfolios', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
})
expect(response.status).toBe(403)
expect(response.error).toContain('CSRF')
```

### 3. Test Roles

```typescript
// As regular user accessing admin route - should fail
const response = await fetch('/api/admin/users', {
  headers: getAuthHeaders('user'),
})
expect(response.status).toBe(403)
```

## Common Issues

1. **"CSRF token missing"**
   - Ensure `useCSRF()` hook is used
   - Check cookies are enabled
   - Verify authentication works

2. **"Insufficient permissions"**
   - Check user's role in database
   - Verify role hierarchy
   - Ensure RBAC is enabled

3. **CORS errors**
   - Add origin to allowed list
   - Check preflight handling
   - Verify headers configuration

## Rollback Plan

If issues arise, security features can be disabled:

```typescript
// src/lib/security/security.config.ts
export const SECURITY_FEATURES = {
  CSRF_PROTECTION: false,  // Temporarily disable
  RBAC_ENABLED: false,     // Temporarily disable
  // ...
}
```

Then gradually re-enable as issues are resolved.