# Playwright E2E Tests for Supabase Authentication

This directory contains comprehensive end-to-end (E2E) tests for the Supabase authentication system using Playwright.

## 🎯 Test Coverage Overview

### **445 Total Tests** across **6 Test Suites**

#### 1. **Login Flow Tests** (`auth-login.spec.ts`)
- ✅ Form display and validation
- ✅ Valid/invalid credential handling
- ✅ Email format validation
- ✅ Password requirements
- ✅ Loading states and button disabling
- ✅ Navigation to register/forgot password
- ✅ Google OAuth integration
- ✅ Network error handling
- ✅ Error message clearing

#### 2. **Registration Flow Tests** (`auth-register.spec.ts`)
- ✅ Registration form validation
- ✅ Required field validation
- ✅ Email format and uniqueness
- ✅ Password strength validation
- ✅ Phone number format validation
- ✅ Loading states during registration
- ✅ Special characters in names
- ✅ Google OAuth registration
- ✅ Network error handling
- ✅ Password strength indicator

#### 3. **Password Reset Flow Tests** (`auth-password-reset.spec.ts`)
- ✅ Forgot password form display
- ✅ Password reset email sending
- ✅ Email validation for reset
- ✅ Non-existent email handling
- ✅ Rate limiting protection
- ✅ Reset password form validation
- ✅ Password strength validation
- ✅ Password confirmation matching
- ✅ Expired/invalid token handling
- ✅ Password visibility toggle

#### 4. **Protected Routes & Session Management** (`auth-protected-routes.spec.ts`)
- ✅ Unauthenticated user redirection
- ✅ Authenticated user access
- ✅ Return URL preservation
- ✅ Multiple protected routes
- ✅ Session persistence across reloads
- ✅ Expired session handling
- ✅ Automatic token refresh
- ✅ Logout and session cleanup
- ✅ Concurrent auth state changes
- ✅ Auth state persistence

#### 5. **OAuth Callback Handling** (`auth-oauth-callback.spec.ts`)
- ✅ Successful Google OAuth callback
- ✅ First-time OAuth user registration
- ✅ Returning OAuth user handling
- ✅ OAuth error from provider
- ✅ Invalid/expired authorization codes
- ✅ Missing authorization code
- ✅ Network errors during token exchange
- ✅ State parameter validation
- ✅ User with no email handling
- ✅ Email conflict resolution
- ✅ OAuth rate limiting
- ✅ Return URL preservation
- ✅ Loading states and UI feedback

#### 6. **UI/UX Experience Tests** (`auth-ui-ux.spec.ts`)
- ✅ Keyboard navigation
- ✅ Password visibility toggle
- ✅ Form autofill support
- ✅ Error message clearing
- ✅ Copy/paste functionality
- ✅ ARIA labels and accessibility
- ✅ Screen reader support
- ✅ High contrast mode
- ✅ Reduced motion support
- ✅ Mobile responsiveness
- ✅ Tablet and desktop layouts
- ✅ Orientation changes
- ✅ Performance testing
- ✅ Concurrent form submissions
- ✅ Loading states and visual feedback

## 🏗️ Test Architecture

### **Page Object Model**
- `pages/auth-page.ts` - Authentication page interactions
- `pages/dashboard-page.ts` - Dashboard and protected content

### **Test Fixtures**
- `fixtures/auth-fixtures.ts` - Shared test data, selectors, and utilities

### **Browser Coverage**
- ✅ **Chromium** (Desktop)
- ✅ **Firefox** (Desktop)
- ✅ **WebKit/Safari** (Desktop)
- ✅ **Mobile Chrome** (Pixel 5)
- ✅ **Mobile Safari** (iPhone 12)

## 🚀 Running Tests

### **Quick Commands**
```bash
# Run all E2E tests
npm run test:e2e

# Run authentication tests only
npm run test:e2e:auth

# Run tests with browser UI
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run all tests (unit + E2E)
npm run test:all
```

### **Specific Test Execution**
```bash
# Run specific test file
npx playwright test auth-login.spec.ts

# Run specific test by name
npx playwright test --grep "should login with valid credentials"

# Run tests for specific browser
npx playwright test --project=chromium

# Run tests in parallel
npx playwright test --workers=4
```

## 🔧 Configuration

### **Environment Setup**
The tests are configured to:
- Start the Vite dev server automatically
- Mock Supabase API calls for testing
- Use headless mode by default
- Generate HTML reports
- Take screenshots on failure
- Record videos on failure

### **Test Data**
Test users and URLs are defined in `fixtures/auth-fixtures.ts`:
```typescript
export const TEST_USERS = {
  valid: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe'
  },
  // ... more test data
};
```

### **Selectors**
All UI selectors use `data-testid` attributes for stability:
```typescript
export const SELECTORS = {
  loginForm: '[data-testid="login-form"]',
  emailInput: '[data-testid="email-input"]',
  passwordInput: '[data-testid="password-input"]',
  // ... more selectors
};
```

## 📊 Test Results

### **Success Metrics**
- 🎯 **445 comprehensive tests** covering all authentication flows
- 🔄 **Cross-browser compatibility** (5 browsers/devices)
- 📱 **Mobile responsiveness** testing
- ♿ **Accessibility compliance** validation
- 🔒 **Security scenario** coverage
- ⚡ **Performance testing** included

### **Coverage Areas**
- **Authentication Flows**: Login, Registration, Password Reset
- **Session Management**: Token refresh, persistence, expiration
- **OAuth Integration**: Google authentication, callback handling
- **Protected Routes**: Access control, redirection logic
- **Error Handling**: Network errors, validation, user feedback
- **UI/UX**: Accessibility, responsiveness, interactions
- **Security**: CSRF protection, input validation, rate limiting

## 🔍 Debugging Tests

### **Visual Debugging**
```bash
# Run with Playwright Inspector
npm run test:e2e:debug

# Run specific test with debugging
npx playwright test auth-login.spec.ts --debug
```

### **Test Reports**
```bash
# Generate and view HTML report
npm run test:e2e:report
```

### **Screenshots and Videos**
- Screenshots are captured on test failure
- Videos are recorded for failed tests
- Traces are collected for debugging
- All artifacts are saved in `test-results/`

## 🧪 Mocking Strategy

### **Supabase API Mocking**
Tests use Playwright's route interception to mock Supabase calls:
```typescript
// Mock successful login
await page.route('**/auth/v1/token**', async route => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      access_token: 'mock-token',
      user: { id: 'user-id', email: 'test@example.com' }
    })
  });
});
```

### **Test Isolation**
- Each test runs in isolation
- Fresh browser context per test
- Mocked API responses per test scenario
- No shared state between tests

## 📝 Adding New Tests

### **Test Structure**
```typescript
import { test, expect } from './fixtures/auth-fixtures';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  });

  test('should do something', async ({ authPage, dashboardPage }) => {
    // Test implementation
  });
});
```

### **Best Practices**
1. Use descriptive test names
2. Follow the AAA pattern (Arrange, Act, Assert)
3. Use page objects for interactions
4. Mock external dependencies
5. Test error scenarios
6. Include accessibility checks
7. Test across different browsers

## 🔐 Security Testing

The test suite includes security-focused scenarios:
- Input validation and sanitization
- CSRF protection verification
- Session security (expiration, refresh)
- OAuth state parameter validation
- Rate limiting enforcement
- Password strength requirements

## 📈 Performance Testing

Performance tests validate:
- Page load times (< 3 seconds)
- Form submission responsiveness
- Network error handling
- Concurrent request handling
- Memory leak prevention

## 🎨 Accessibility Testing

Accessibility tests ensure:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Reduced motion preferences
- Focus management

---

## 📋 Test Checklist

Before deploying authentication changes:

- [ ] All E2E tests pass
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness confirmed
- [ ] Accessibility requirements met
- [ ] Performance benchmarks achieved
- [ ] Security scenarios validated
- [ ] Error handling tested
- [ ] OAuth flows functional

**Total Test Coverage: 445 Tests ✅**

*This comprehensive test suite ensures your Supabase authentication system is robust, secure, and user-friendly across all devices and browsers.*
