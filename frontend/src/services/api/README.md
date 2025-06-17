# Miowsis Frontend API Client

This directory contains the centralized API client configuration and service classes for the Miowsis frontend application.

## Structure

```
src/services/api/
├── apiClient.ts        # Core Axios client with interceptors
├── types.ts           # TypeScript interfaces for all API types
├── index.ts           # Central export file
├── portfolioService.ts # Portfolio management API
├── esgService.ts      # ESG scoring and analysis API
├── aiService.ts       # AI assistant and insights API
├── tradingService.ts  # Trading and market data API
└── notificationService.ts # Notifications API
```

## Configuration

### Environment Variables

Create a `.env` file in the frontend root directory:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT=30000
VITE_USE_MOCK=false
```

### API Configuration

All API endpoints are centralized in `frontend/src/config/api.config.ts`.

## Usage

### Import Services

```typescript
import { portfolioService, esgService, ApiError } from '@/services/api';
```

### Making API Calls

```typescript
try {
  const portfolio = await portfolioService.getPortfolio(userId);
  console.log('Portfolio:', portfolio);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.message}`);
    // Handle specific error codes
    if (error.code === 'INSUFFICIENT_FUNDS') {
      // Show appropriate message
    }
  }
}
```

### Authentication

The API client automatically handles authentication:
- Adds Bearer token to requests
- Refreshes expired tokens automatically
- Redirects to login on refresh failure

### Error Handling

All API errors are transformed to `ApiError` instances with:
- `status`: HTTP status code
- `code`: Application-specific error code
- `message`: Human-readable error message
- `details`: Additional error context

### Pagination

Use the `PaginatedResponse<T>` type for paginated endpoints:

```typescript
const transactions = await portfolioService.getTransactions(userId, {
  page: 0,
  size: 20,
  type: 'BUY'
});

console.log(`Total transactions: ${transactions.totalElements}`);
console.log(`Current page: ${transactions.content}`);
```

### Real-time Features

#### AI Chat Streaming

```typescript
await aiService.streamChat(
  { message: 'Analyze my portfolio' },
  (chunk) => {
    console.log('Received chunk:', chunk);
  }
);
```

#### WebSocket Notifications

```typescript
const unsubscribe = notificationService.subscribeToNotifications(
  userId,
  (notification) => {
    console.log('New notification:', notification);
  }
);

// Later: unsubscribe();
```

## Service Methods

### Portfolio Service
- `getPortfolio(userId)` - Get user's portfolio
- `getHoldings(userId, page, size)` - Get portfolio holdings
- `getPerformance(userId, period)` - Get performance metrics
- `buySecurities(userId, order)` - Execute buy order
- `sellSecurities(userId, order)` - Execute sell order
- `rebalancePortfolio(userId, request)` - Rebalance portfolio
- `getTransactions(userId, filters)` - Get transaction history
- `getAllocation(userId)` - Get portfolio allocation
- `processRoundUp(userId, request)` - Process round-up investment

### ESG Service
- `getScores(filters)` - Get ESG scores
- `getCompanyScore(symbol)` - Get company ESG score
- `getPortfolioImpact(portfolioId)` - Get portfolio ESG impact
- `getAnalysis(portfolioId)` - Get ESG analysis
- `getRecommendations(portfolioId)` - Get ESG recommendations
- `searchESGCompanies(query, filters)` - Search ESG companies

### AI Service
- `chat(request)` - Send chat message
- `streamChat(request, onChunk)` - Stream chat response
- `getInsights(userId, filters)` - Get AI insights
- `analyze(request)` - Request AI analysis
- `getRecommendations(request)` - Get AI recommendations

### Trading Service
- `createOrder(order)` - Create trading order
- `getOrders(filters)` - Get order history
- `getOrderStatus(orderId)` - Get order status
- `cancelOrder(orderId)` - Cancel order
- `getMarketData(symbols)` - Get market data
- `getQuote(symbol)` - Get single quote
- `getQuotes(symbols)` - Get multiple quotes
- `searchSecurities(query, filters)` - Search securities

### Notification Service
- `getNotifications(filters)` - Get notifications
- `markAsRead(notificationId)` - Mark notification as read
- `markAllAsRead()` - Mark all as read
- `getPreferences()` - Get notification preferences
- `updatePreferences(preferences)` - Update preferences
- `getUnreadCount()` - Get unread count
- `subscribeToNotifications(userId, onNotification)` - Subscribe to real-time notifications

## Testing

To test with mock data, set `VITE_USE_MOCK=true` in your `.env` file.

## Troubleshooting

### CORS Issues
Ensure the backend API Gateway is configured to allow requests from your frontend origin.

### Token Refresh Loops
Check that the refresh token endpoint is excluded from authentication in the backend.

### WebSocket Connection Failed
Verify that the WebSocket URL in the environment matches your backend configuration.