# Integration Test Patterns for MIOwSIS Frontend

## Overview
Comprehensive integration test suite for the MIOwSIS frontend application, covering authentication flows, portfolio operations, and AI chat functionality.

## Test Structure
```
src/__tests__/integration/
├── auth/
│   └── authFlow.test.ts          # Authentication integration tests
├── portfolio/
│   └── portfolioOperations.test.ts # Portfolio operations tests
├── chat/
│   └── aiChat.test.ts            # AI chat functionality tests
├── utils/
│   ├── testSetup.ts              # Test environment setup
│   ├── mockHandlers.ts           # API mock response handlers
│   └── testHelpers.ts            # Common test utilities
└── setupTests.ts                 # Global test configuration
```

## Key Testing Patterns

### 1. Authentication Flow Testing
```typescript
// Test complete auth lifecycle
- Login with valid/invalid credentials
- Token refresh mechanism
- Automatic logout on token expiry
- Registration flow
- Password reset flow
- Protected route access
```

### 2. Portfolio Operations Testing
```typescript
// Test portfolio management
- View portfolio summary and holdings
- Execute buy/sell orders (market, limit, stop-loss)
- Portfolio rebalancing
- Transaction history
- Round-up investments
- Error handling (insufficient funds/shares)
```

### 3. AI Chat Testing
```typescript
// Test AI interactions
- Basic chat request/response
- Streaming responses (SSE)
- Context-aware conversations
- AI insights and recommendations
- Portfolio analysis
- Rate limiting handling
```

## Mock Patterns

### API Response Mocking
```typescript
const mockAxios = createMockAxios({
  'POST /api/endpoint': (config) => ({
    status: 200,
    data: { /* response data */ },
    delay: 100 // optional delay
  })
});
```

### SSE Streaming Mock
```typescript
const mockSSE = createMockSSE(['chunk1', 'chunk2']);
global.fetch = jest.fn().mockResolvedValueOnce(mockSSE);
```

### Redux Store Testing
```typescript
const store = createTestStore(initialState);
store.dispatch(action);
expect(store.getState()).toEqual(expectedState);
```

## Test Commands
```bash
# Run all integration tests
npm run test:integration

# Run with coverage
npm run test:integration:coverage

# Watch mode for development
npm run test:integration:watch

# Interactive UI
npm run test:integration:ui

# Run all tests (unit + integration)
npm run test:all
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on others
2. **Mocking**: Mock external dependencies (API calls, browser APIs)
3. **Async Handling**: Use proper async/await patterns for API calls
4. **Error Testing**: Test both success and failure scenarios
5. **State Management**: Test Redux state changes
6. **Coverage**: Aim for 80%+ line coverage, 70%+ branch coverage

## Common Test Utilities

### Setup Test Environment
```typescript
setupTestEnvironment(); // Mock localStorage, crypto, etc.
```

### Render with Providers
```typescript
const { getByText, store } = renderWithProviders(<Component />, {
  store: customStore,
  initialRoute: '/dashboard'
});
```

### Wait for Async Operations
```typescript
await waitForAsync(100); // Wait for promises to resolve
```

### Create Mock Data
```typescript
const portfolio = createMockPortfolio({ totalValue: 20000 });
const holding = createMockHolding('AAPL', { quantity: 20 });
const transaction = createMockTransaction('BUY', { symbol: 'MSFT' });
```

## Token Refresh Testing Pattern
The integration tests include comprehensive token refresh testing:
- Automatic retry with new token on 401
- Queue multiple requests during refresh
- Logout on refresh failure
- Prevent multiple simultaneous refreshes

## Error Handling Patterns
All tests include error scenario coverage:
- Network errors
- Server errors (5xx)
- Client errors (4xx)
- Validation errors
- Rate limiting
- Timeout handling

## Performance Considerations
- Use `vitest` for fast test execution
- Fork pool for parallel test running
- Inline critical dependencies
- Mock heavy components (Charts, 3D)

This test suite ensures comprehensive coverage of all critical user flows and API interactions in the MIOwSIS application.