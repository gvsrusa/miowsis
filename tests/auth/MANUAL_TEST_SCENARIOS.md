# Manual Test Scenarios for Supabase Authentication

## Pre-Test Setup

### Environment Configuration
- Supabase project configured with test database
- Test user accounts created:
  - Regular user: `test@miowsis.com` / `TestPassword123!`
  - Admin user: `admin@miowsis.com` / `AdminPassword123!`
  - Unverified user: `unverified@miowsis.com` / `UnverifiedPassword123!`

### Browser Testing Matrix
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## Test Scenarios

### 1. User Registration

#### Scenario 1.1: Successful Registration
**Steps:**
1. Navigate to `/register`
2. Fill form with valid data:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `newuser@miowsis.com`
   - Password: `NewPassword123!`
   - Confirm Password: `NewPassword123!`
3. Click "Register" button

**Expected Results:**
- Loading spinner appears
- Success message displayed
- User redirected to email verification page
- Verification email sent to user
- Account created in Supabase

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 1.2: Registration with Existing Email
**Steps:**
1. Navigate to `/register`
2. Use existing email: `test@miowsis.com`
3. Fill other fields with valid data
4. Submit form

**Expected Results:**
- Error message: "Email already registered"
- No account created
- User remains on registration page

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 1.3: Weak Password Validation
**Steps:**
1. Navigate to `/register`
2. Enter weak password: `123`
3. Attempt to submit

**Expected Results:**
- Validation error before submission
- Clear password requirements shown
- Submit button disabled until valid password

**Pass/Fail:** ⭕ (To be tested)

### 2. User Login

#### Scenario 2.1: Successful Login
**Steps:**
1. Navigate to `/login`
2. Enter valid credentials:
   - Email: `test@miowsis.com`
   - Password: `TestPassword123!`
3. Click "Login"

**Expected Results:**
- Loading state shown
- Redirect to dashboard or onboarding
- User menu visible in navigation
- Tokens stored in localStorage
- Session persists across page refreshes

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 2.2: Invalid Credentials
**Steps:**
1. Navigate to `/login`
2. Enter invalid credentials:
   - Email: `test@miowsis.com`
   - Password: `WrongPassword`
3. Submit form

**Expected Results:**
- Error message displayed
- User remains on login page
- No tokens stored
- Form can be resubmitted

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 2.3: Unverified Email Login
**Steps:**
1. Try to login with unverified account
2. Use credentials: `unverified@miowsis.com`

**Expected Results:**
- Login blocked or limited functionality
- Message about email verification required
- Option to resend verification email

**Pass/Fail:** ⭕ (To be tested)

### 3. Session Management

#### Scenario 3.1: Session Persistence
**Steps:**
1. Login successfully
2. Close browser tab
3. Reopen application
4. Navigate to protected route

**Expected Results:**
- User remains logged in
- No re-authentication required
- Tokens valid and refreshed if needed

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 3.2: Token Expiration
**Steps:**
1. Login successfully
2. Wait for token to expire (or manually expire)
3. Perform action requiring authentication

**Expected Results:**
- Automatic token refresh attempted
- If refresh fails, redirect to login
- User notified about session expiration

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 3.3: Concurrent Sessions
**Steps:**
1. Login in Browser A
2. Login with same account in Browser B
3. Perform actions in both browsers
4. Logout from Browser A
5. Check Browser B status

**Expected Results:**
- Both sessions work independently
- Logout from one doesn't affect the other
- Each browser maintains its own session

**Pass/Fail:** ⭕ (To be tested)

### 4. Protected Routes

#### Scenario 4.1: Unauthenticated Access
**Steps:**
1. Clear all authentication data
2. Navigate directly to `/dashboard`
3. Try to access other protected routes

**Expected Results:**
- Immediate redirect to login page
- Original URL preserved for post-login redirect
- No sensitive data visible

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 4.2: Post-Login Redirect
**Steps:**
1. While unauthenticated, navigate to `/portfolio`
2. Get redirected to login
3. Login successfully

**Expected Results:**
- After login, redirect to originally requested `/portfolio`
- User doesn't lose their intended destination

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 4.3: Onboarding Flow
**Steps:**
1. Login with user who hasn't completed onboarding
2. Try to access dashboard or other routes

**Expected Results:**
- Redirect to onboarding process
- Cannot access other routes until onboarding complete
- Progress saved if user navigates away

**Pass/Fail:** ⭕ (To be tested)

### 5. Password Reset

#### Scenario 5.1: Request Password Reset
**Steps:**
1. Go to login page
2. Click "Forgot Password"
3. Enter registered email
4. Submit request

**Expected Results:**
- Confirmation message shown
- Reset email sent to user
- Email contains secure reset link
- Link expires after reasonable time

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 5.2: Complete Password Reset
**Steps:**
1. Receive password reset email
2. Click reset link
3. Enter new password
4. Confirm password change
5. Try to login with new password

**Expected Results:**
- Reset page loads securely
- New password accepted
- Old password no longer works
- Automatic login after reset

**Pass/Fail:** ⭕ (To be tested)

### 6. Security Tests

#### Scenario 6.1: XSS Prevention
**Steps:**
1. Enter script tags in login/register forms
2. Submit forms with malicious input
3. Check for script execution

**Expected Results:**
- No script execution
- Input properly sanitized
- Error messages don't contain executable code

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 6.2: CSRF Protection
**Steps:**
1. Inspect forms for CSRF tokens
2. Try to submit requests without proper tokens
3. Attempt cross-site request forgery

**Expected Results:**
- All forms include CSRF protection
- Requests without tokens rejected
- Cross-site requests blocked

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 6.3: Token Security
**Steps:**
1. Login successfully
2. Inspect browser storage
3. Check network requests
4. Look for token exposure

**Expected Results:**
- Tokens stored securely (HttpOnly if possible)
- No tokens in URL parameters
- HTTPS enforced for all auth requests
- Sensitive data not in localStorage

**Pass/Fail:** ⭕ (To be tested)

### 7. Mobile Testing

#### Scenario 7.1: Mobile Login Flow
**Steps:**
1. Use mobile device or simulate mobile viewport
2. Navigate to login page
3. Test touch interactions
4. Complete login process

**Expected Results:**
- Forms responsive and usable
- Touch targets appropriate size
- Virtual keyboard doesn't obstruct interface
- All functionality works on mobile

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 7.2: Mobile Session Handling
**Steps:**
1. Login on mobile device
2. Switch between apps
3. Return to application
4. Test background/foreground transitions

**Expected Results:**
- Session maintained during app switching
- Appropriate behavior when app backgrounded
- Smooth transitions between states

**Pass/Fail:** ⭕ (To be tested)

### 8. Performance Tests

#### Scenario 8.1: Login Performance
**Steps:**
1. Measure time from form submission to dashboard load
2. Test with various network conditions
3. Monitor resource usage

**Expected Results:**
- Login completes within 2 seconds on good connection
- Appropriate loading states shown
- Graceful degradation on slow connections

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 8.2: Session Check Performance
**Steps:**
1. Login and navigate between pages
2. Measure session verification time
3. Test with expired tokens

**Expected Results:**
- Session checks complete within 500ms
- No blocking of UI during checks
- Efficient token refresh process

**Pass/Fail:** ⭕ (To be tested)

### 9. Accessibility Tests

#### Scenario 9.1: Keyboard Navigation
**Steps:**
1. Use only keyboard to navigate auth forms
2. Tab through all interactive elements
3. Submit forms using keyboard

**Expected Results:**
- All elements accessible via keyboard
- Logical tab order
- Clear focus indicators
- Forms submittable with Enter key

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 9.2: Screen Reader Compatibility
**Steps:**
1. Use screen reader to test auth flows
2. Check ARIA labels and descriptions
3. Verify error message accessibility

**Expected Results:**
- All form elements properly labeled
- Error messages announced clearly
- Navigation landmarks present
- Status changes communicated

**Pass/Fail:** ⭕ (To be tested)

### 10. Edge Cases

#### Scenario 10.1: Network Interruption
**Steps:**
1. Start login process
2. Disconnect network during submission
3. Reconnect and retry

**Expected Results:**
- Appropriate error handling
- User can retry without losing data
- Clear messaging about connectivity issues

**Pass/Fail:** ⭕ (To be tested)

#### Scenario 10.2: Browser Storage Disabled
**Steps:**
1. Disable localStorage/cookies
2. Attempt authentication flows
3. Test fallback mechanisms

**Expected Results:**
- Graceful degradation
- User informed about storage requirements
- Alternative session management if possible

**Pass/Fail:** ⭕ (To be tested)

## Test Execution Checklist

### Pre-Testing
- [ ] Test environment configured
- [ ] Test data prepared
- [ ] Browser matrix ready
- [ ] Network conditions tested

### During Testing
- [ ] Document all bugs found
- [ ] Screenshot failures
- [ ] Note performance issues
- [ ] Record security concerns

### Post-Testing
- [ ] Summarize results
- [ ] Prioritize issues
- [ ] Create bug reports
- [ ] Update test scenarios

## Success Criteria

### Critical Requirements (Must Pass)
- [ ] Users can register successfully
- [ ] Users can login with valid credentials
- [ ] Protected routes are secure
- [ ] Sessions persist appropriately
- [ ] Password reset works correctly

### High Priority (Should Pass)
- [ ] Error handling is user-friendly
- [ ] Performance meets targets
- [ ] Mobile experience is good
- [ ] Security measures are effective

### Medium Priority (Nice to Have)
- [ ] Accessibility features work well
- [ ] Edge cases handled gracefully
- [ ] Advanced security features present

## Risk Assessment

### High Risk Issues
- Authentication bypass
- Token exposure
- Session hijacking
- Data leakage

### Medium Risk Issues
- Poor user experience
- Performance problems
- Accessibility barriers
- Mobile compatibility

### Low Risk Issues
- Minor UI glitches
- Non-critical error messages
- Advanced feature limitations

## Issue Tracking Template

**Issue ID:** AUTH-001
**Severity:** High/Medium/Low
**Browser:** Chrome 120
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:** What should happen
**Actual Result:** What actually happened
**Screenshots:** [Attach if applicable]
**Workaround:** [If available]
**Notes:** Additional context