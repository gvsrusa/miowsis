# Service Worker Auth Route Handling

## Overview
This document describes how the service worker configuration handles authentication routes to prevent interference with OAuth callbacks and auth flows.

## Configuration Details

### 1. Next.js Configuration (`next.config.ts`)
The service worker configuration includes critical exclusions for auth routes:

```javascript
navigateFallbackDenylist: [
  /\/api\/auth\/.*/,  // NextAuth API routes
  /\/auth\/.*/,        // Auth pages
  /\/api\/.*/,         // All API routes
  /\/_next\/.*/,       // Next.js internals
]
```

This ensures that:
- OAuth callbacks (`/api/auth/callback/[provider]`) are never intercepted
- Auth pages load directly from the server
- API routes bypass service worker caching

### 2. Service Worker Registration (`public/sw-registration.js`)
The registration script includes safety checks:
- Skips registration on auth routes
- Provides utility functions to identify auth-related URLs
- Handles auth redirects appropriately

### 3. Middleware Configuration (`src/middleware.ts`)
The middleware properly allows auth routes:
- `/auth/callback` is in the public routes list
- API auth routes are explicitly allowed
- No interference with OAuth flow

## Common Issues and Solutions

### Issue: 404 Error on OAuth Callback
**Cause**: Service worker intercepting the callback URL
**Solution**: Our configuration excludes all `/api/auth/*` routes from service worker

### Issue: Infinite Redirect Loop
**Cause**: Service worker caching redirect responses
**Solution**: Auth routes bypass service worker entirely

### Issue: Session Not Persisting
**Cause**: Service worker interfering with cookie setting
**Solution**: API routes excluded from service worker scope

## Testing Auth Flow with Service Worker

1. **Clear all caches**:
   ```javascript
   // In browser console
   caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
   navigator.serviceWorker.getRegistrations()
     .then(regs => regs.forEach(reg => reg.unregister()));
   ```

2. **Test OAuth flow**:
   - Sign out completely
   - Clear cookies and local storage
   - Attempt Google sign-in
   - Verify callback URL matches exactly: `/api/auth/callback/google`

3. **Verify exclusions**:
   - Open DevTools > Application > Service Workers
   - Check that auth routes show "Network" in Network tab
   - Confirm no auth routes appear in Cache Storage

## Environment Configuration

Ensure these environment variables are set correctly:
```env
NEXTAUTH_URL=http://localhost:3000  # Development
NEXTAUTH_URL=https://yourdomain.com  # Production
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Production Considerations

1. **HTTPS Required**: OAuth providers require HTTPS in production
2. **Exact URL Match**: Callback URLs must match exactly in provider console
3. **Service Worker Scope**: Ensure SW scope doesn't interfere with auth routes
4. **Cache Headers**: Auth endpoints should have `no-cache` headers

## Debugging

Enable service worker debugging:
1. Chrome DevTools > Application > Service Workers > "Update on reload"
2. Check "Bypass for network" during testing
3. Monitor Network tab for auth requests
4. Verify requests show "Network" source, not "ServiceWorker"

## Implementation Checklist

- [x] Configure `navigateFallbackDenylist` in next.config.ts
- [x] Exclude auth routes from runtime caching
- [x] Create SW registration with auth checks
- [x] Verify middleware allows auth routes
- [x] Document auth flow exclusions
- [x] Test OAuth callbacks with SW enabled