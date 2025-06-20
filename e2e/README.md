# E2E Testing with Playwright & Supabase

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm run test:e2e

# Run auth tests specifically
npm run test:e2e -- e2e/supabase-auth*.spec.ts

# Run with UI mode (recommended for debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npx playwright test --headed
```

## Test Files

- `supabase-auth.spec.ts` - Comprehensive UI tests for authentication flows
- `supabase-auth-api.spec.ts` - API-based authentication tests (faster, more reliable)
- `supabase-auth-browser.spec.ts` - Browser automation tests for Supabase client
- `auth.setup.ts` - Reusable authentication setup
- `utils/supabase-test-helpers.ts` - Helper functions for Supabase testing

## Key Features

1. **API-Based Authentication** - Fast auth without UI interaction
2. **RLS Testing** - Validate row-level security policies
3. **OAuth Flow Testing** - Test Google OAuth integration
4. **Session Persistence** - Verify auth state across refreshes
5. **Error Handling** - Test invalid credentials and edge cases

## Important Notes

- Use real email domains (gmail.com, not example.com)
- Tests create unique users with timestamps to avoid conflicts
- Authentication state can be reused across tests for speed
- See `SUPABASE_AUTH_TESTING_GUIDE.md` for detailed documentation

## Troubleshooting

If tests fail:
1. Ensure dev server is running: `npm run dev`
2. Check `.env.local` has valid Supabase credentials
3. Use `--debug` flag for interactive debugging
4. Check `test-results/` for screenshots on failure