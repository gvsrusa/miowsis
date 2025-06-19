# OAuth Setup Guide - Fixing Google Sign-in 404 Errors

## Common Causes of Google OAuth 404 Errors

### 1. Incorrect Redirect URIs in Google Console

The most common cause of 404 errors during Google sign-in is misconfigured redirect URIs in the Google Cloud Console.

#### Required Redirect URIs

For NextAuth.js with Google OAuth, you need to add these URIs to your Google OAuth 2.0 Client ID:

**Development:**
```
http://localhost:3000/api/auth/callback/google
```

**Production:**
```
https://yourdomain.com/api/auth/callback/google
```

**If using custom NEXTAUTH_URL:**
```
${NEXTAUTH_URL}/api/auth/callback/google
```

### 2. Environment Variable Configuration

Ensure your environment variables are properly set:

```env
# .env.local or .env
NEXTAUTH_URL=http://localhost:3000  # For development
# NEXTAUTH_URL=https://yourdomain.com  # For production

NEXTAUTH_SECRET=your-secure-random-string-here

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click on your OAuth 2.0 Client ID or create a new one
5. Add the following to "Authorized JavaScript origins":
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
6. Add the following to "Authorized redirect URIs":
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Save the changes

### 4. Common Mistakes to Avoid

1. **Trailing slashes**: Don't add trailing slashes to redirect URIs
   - ❌ `http://localhost:3000/api/auth/callback/google/`
   - ✅ `http://localhost:3000/api/auth/callback/google`

2. **Wrong protocol**: Ensure you're using the correct protocol
   - ❌ `https://localhost:3000/api/auth/callback/google` (localhost usually uses http)
   - ✅ `http://localhost:3000/api/auth/callback/google`

3. **Port numbers**: Include port numbers for development
   - ❌ `http://localhost/api/auth/callback/google`
   - ✅ `http://localhost:3000/api/auth/callback/google`

4. **Case sensitivity**: URIs are case-sensitive
   - ❌ `http://localhost:3000/api/auth/callback/Google`
   - ✅ `http://localhost:3000/api/auth/callback/google`

### 5. Testing Your Configuration

1. **Check environment variables are loaded:**
   ```javascript
   // Add to your pages/api/auth/[...nextauth]/route.ts temporarily
   console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
   console.log('Google Client ID exists:', !!process.env.GOOGLE_CLIENT_ID)
   ```

2. **Verify the callback URL:**
   - Start your development server
   - Try to sign in with Google
   - Check the browser's network tab for the exact redirect_uri being used
   - Ensure this matches what's in your Google Console

3. **Check NextAuth debug logs:**
   - Set `debug: true` in your NextAuth configuration
   - Check console logs for detailed error messages

### 6. Troubleshooting Steps

1. **Clear browser cache and cookies**
   - OAuth tokens can get cached
   - Try in an incognito/private window

2. **Regenerate OAuth credentials**
   - If nothing else works, create new OAuth 2.0 credentials
   - Update your environment variables

3. **Check for middleware conflicts**
   - Ensure your middleware isn't blocking the `/api/auth/*` routes
   - The auth API routes should be publicly accessible

4. **Verify Supabase integration**
   - If using Supabase adapter, ensure service role key is valid
   - Check that Supabase URL is correct

### 7. Production Deployment Checklist

- [ ] Update NEXTAUTH_URL to production URL
- [ ] Add production redirect URI to Google Console
- [ ] Ensure NEXTAUTH_SECRET is set and secure
- [ ] Verify SSL certificate is valid (Google requires HTTPS in production)
- [ ] Check that environment variables are properly set in hosting platform
- [ ] Test sign-in flow in production environment

### 8. Error Handling Implementation

The application now includes:

1. **Enhanced 404 page** (`/app/not-found.tsx`)
   - User-friendly error messaging
   - Navigation options
   - Debug information in development

2. **Runtime error boundary** (`/app/error.tsx`)
   - Catches and displays runtime errors gracefully
   - Provides recovery options

3. **Global error handler** (`/app/global-error.tsx`)
   - Handles critical application errors
   - Ensures users always see a helpful error page

4. **Auth-specific error page** (`/app/auth/error/page.tsx`)
   - Handles various authentication errors
   - Provides specific guidance for each error type
   - Includes retry and navigation options

### 9. Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Providers - Google](https://next-auth.js.org/providers/google)

### 10. Support

If you continue to experience issues:

1. Check the application logs for detailed error messages
2. Verify all redirect URIs match exactly
3. Ensure all environment variables are properly set
4. Contact support with:
   - The exact error message
   - Your NEXTAUTH_URL value
   - The redirect URI from the browser's network tab
   - Any console error messages