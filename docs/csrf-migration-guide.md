# CSRF Protection Migration Guide

This guide helps you migrate existing code to use the new CSRF protection system.

## Quick Start

The fastest way to add CSRF protection is to use `secureFetch` instead of regular `fetch`:

```typescript
// Before
const response = await fetch('/api/portfolios', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})

// After
import { secureFetch } from '@/lib/security/secure-fetch'

const response = await secureFetch('/api/portfolios', {
  method: 'POST',
  body: JSON.stringify(data),
})
```

## Step-by-Step Migration

### 1. Update API Route Handlers

Add CSRF validation to all POST, PUT, PATCH, and DELETE handlers:

```typescript
// Before
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... rest of handler
}

// After
import { validateCSRFProtection } from '@/lib/security/csrf'

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const csrfValidation = await validateCSRFProtection(request)
  if (!csrfValidation.valid) {
    return NextResponse.json(
      { error: csrfValidation.error || 'CSRF validation failed' },
      { status: csrfValidation.error === 'Unauthorized' ? 401 : 403 }
    )
  }
  
  const session = csrfValidation.session
  // ... rest of handler
}
```

### 2. Update React Components

#### Option A: Use secureFetch (Recommended)

```typescript
// Before
const handleSubmit = async () => {
  const response = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  })
}

// After
import { secureFetch } from '@/lib/security/secure-fetch'

const handleSubmit = async () => {
  const response = await secureFetch('/api/data', {
    method: 'POST',
    body: JSON.stringify(formData),
  })
}
```

#### Option B: Use the useCSRF hook

```typescript
// Before
function MyComponent() {
  const handleDelete = async (id: string) => {
    await fetch(`/api/items/${id}`, { method: 'DELETE' })
  }
}

// After
import { useCSRF } from '@/hooks/use-csrf'

function MyComponent() {
  const { getHeaders } = useCSRF()
  
  const handleDelete = async (id: string) => {
    await fetch(`/api/items/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
  }
}
```

### 3. Update Forms

Convert existing forms to use CSRFForm:

```tsx
// Before
<form onSubmit={handleSubmit}>
  <input name="email" type="email" />
  <button type="submit">Submit</button>
</form>

// After
import { CSRFForm } from '@/components/security/csrf-form'

<CSRFForm onSubmit={async (e, csrfToken) => {
  e.preventDefault()
  // Use csrfToken in your submission
}}>
  <input name="email" type="email" />
  <button type="submit">Submit</button>
</CSRFForm>
```

## Common Patterns

### Batch Operations

When making multiple requests:

```typescript
import { secureFetch } from '@/lib/security/secure-fetch'

async function batchUpdate(items: Item[]) {
  const updates = items.map(item =>
    secureFetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify(item),
    })
  )
  
  return Promise.all(updates)
}
```

### Error Handling

Handle CSRF-specific errors:

```typescript
const { data, error } = await secureApi('/api/data', {
  method: 'POST',
  body: payload,
})

if (error) {
  if (error.includes('CSRF')) {
    // Token might be expired, refresh the page
    window.location.reload()
  } else {
    // Handle other errors
    toast.error(error)
  }
}
```

### Testing

Update your tests to include CSRF tokens:

```typescript
import { createCSRFProtectedRequest } from '@/lib/security/csrf-test-utils'

test('should create portfolio', async () => {
  const request = await createCSRFProtectedRequest('/api/portfolios', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test' }),
  })
  
  const response = await POST(request)
  expect(response.status).toBe(201)
})
```

## Checklist

- [ ] Add `validateCSRFProtection` to all state-changing API routes
- [ ] Replace `fetch` with `secureFetch` for POST/PUT/DELETE/PATCH requests
- [ ] Update forms to use `CSRFForm` or include CSRF tokens manually
- [ ] Add CSRF token generation to authentication flow
- [ ] Update tests to include CSRF tokens
- [ ] Test error scenarios (expired tokens, missing tokens)

## Troubleshooting

### "CSRF token missing" errors

1. Ensure you're using `secureFetch` or including the token manually
2. Check that cookies are enabled and not blocked
3. Verify the user is authenticated

### "Invalid CSRF token" errors

1. Token might be expired - tokens last 1 hour
2. Check for multiple tabs/windows with different tokens
3. Ensure you're not mixing production and development environments

### Token not being sent

1. Check browser dev tools for the `X-CSRF-Token` header
2. Verify cookies are being set correctly
3. Ensure you're using `credentials: 'include'` in fetch options