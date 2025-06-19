# CSRF Protection Implementation

This directory contains the CSRF (Cross-Site Request Forgery) protection implementation for the application.

## Overview

CSRF protection prevents malicious websites from performing actions on behalf of authenticated users without their consent. This implementation provides:

1. **Token Generation**: Cryptographically secure tokens tied to user sessions
2. **Token Validation**: Server-side validation for all state-changing requests
3. **Automatic Integration**: Hooks and utilities for easy client-side integration
4. **Middleware Support**: Next.js middleware for automatic token management

## Components

### Core Module (`csrf.ts`)

The main CSRF protection module provides:

- `generateCSRFToken()`: Creates cryptographically secure tokens
- `validateCSRFProtection()`: Validates tokens in API routes
- `createOrRefreshCSRFToken()`: Manages token lifecycle
- Token storage and expiration management

### API Endpoint (`/api/auth/csrf`)

Provides a GET endpoint for clients to fetch fresh CSRF tokens:

```typescript
// Response format
{
  "csrfToken": "secure-token-string",
  "expiresAt": "2024-01-01T00:00:00.000Z"
}
```

### Client Hooks (`use-csrf.ts`)

React hook for managing CSRF tokens in components:

```typescript
const { csrfToken, getHeaders, refreshToken } = useCSRF()

// Use in fetch requests
const response = await fetch('/api/data', {
  method: 'POST',
  headers: getHeaders(),
  body: JSON.stringify(data)
})
```

### Secure Fetch Utilities (`secure-fetch.ts`)

Enhanced fetch functions that automatically include CSRF tokens:

```typescript
// Automatically includes CSRF token
const response = await secureFetch('/api/portfolios', {
  method: 'POST',
  body: JSON.stringify({ name: 'My Portfolio' })
})

// Type-safe API wrapper
const { data, error } = await secureApi<Portfolio>('/api/portfolios', {
  method: 'POST',
  body: { name: 'My Portfolio' }
})
```

### Form Components (`csrf-form.tsx`)

React components for CSRF-protected forms:

```tsx
<CSRFForm onSubmit={async (e, csrfToken) => {
  e.preventDefault()
  // Form submission logic with CSRF token
}}>
  <input name="email" type="email" />
  <button type="submit">Submit</button>
</CSRFForm>
```

## Usage Examples

### 1. Protecting API Routes

```typescript
// In your API route handler
import { validateCSRFProtection } from '@/lib/security/csrf'

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const csrfValidation = await validateCSRFProtection(request)
  if (!csrfValidation.valid) {
    return NextResponse.json(
      { error: csrfValidation.error },
      { status: 403 }
    )
  }
  
  // Process the request
  // ...
}
```

### 2. Client-Side Integration

#### Using the Hook

```typescript
function MyComponent() {
  const { getHeaders } = useCSRF()
  
  const handleSubmit = async () => {
    const response = await fetch('/api/data', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ foo: 'bar' })
    })
  }
}
```

#### Using Secure Fetch

```typescript
import { secureFetch, secureApi } from '@/lib/security/secure-fetch'

// Option 1: Direct fetch
const response = await secureFetch('/api/portfolios', {
  method: 'DELETE'
})

// Option 2: Type-safe API wrapper
const { data, error } = await secureApi<{ success: boolean }>('/api/portfolios/123', {
  method: 'DELETE'
})
```

#### Using Form Components

```tsx
import { CSRFForm } from '@/components/security/csrf-form'

function MyForm() {
  return (
    <CSRFForm onSubmit={async (e, csrfToken) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      
      await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(formData))
      })
    }}>
      <input name="name" required />
      <button type="submit">Submit</button>
    </CSRFForm>
  )
}
```

### 3. Middleware Integration

In your `middleware.ts`:

```typescript
import { csrfMiddleware } from '@/middleware/csrf'

export async function middleware(request: NextRequest) {
  // Apply CSRF middleware
  return csrfMiddleware(request)
}
```

## Security Considerations

1. **Token Storage**: Tokens are stored in httpOnly cookies and server-side memory
2. **Token Rotation**: Tokens expire after 1 hour and are automatically refreshed
3. **Timing Attacks**: Uses constant-time comparison for token validation
4. **SameSite Cookies**: Cookies use SameSite=Lax for additional protection

## Configuration

Key configuration options in `csrf.ts`:

- `CSRF_TOKEN_LENGTH`: Token length (default: 32 bytes)
- `CSRF_HEADER_NAME`: Header name for tokens (default: 'X-CSRF-Token')
- `CSRF_COOKIE_NAME`: Cookie name (default: 'csrf-token')
- `CSRF_TOKEN_EXPIRY`: Token expiration time (default: 1 hour)

## Production Considerations

For production deployments:

1. **Replace in-memory storage** with Redis or database storage for token persistence
2. **Enable secure cookies** by ensuring `NODE_ENV=production`
3. **Configure proper CORS** settings to prevent token leakage
4. **Monitor token validation failures** for potential attack detection
5. **Implement rate limiting** on token generation endpoint

## Testing

When testing CSRF-protected endpoints:

```typescript
// Get a CSRF token first
const tokenResponse = await fetch('/api/auth/csrf')
const { csrfToken } = await tokenResponse.json()

// Use in your test requests
const response = await fetch('/api/portfolios', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'Test Portfolio' })
})
```