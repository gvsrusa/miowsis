# Error Handling Patterns

## Overview
This document outlines the comprehensive error handling system implemented in the Miowsis frontend application.

## Components

### 1. Error Boundaries
- **ErrorBoundary**: Global error boundary component that catches React errors
- **PageErrorBoundary**: Specialized boundary for page-level errors with navigation options

### 2. Notification System
- **ToastNotification**: Single toast notifications with auto-dismiss
- **NotificationStack**: Stacked notifications with animations and priority handling

### 3. Error State Components
- **ErrorState**: Displays error messages with retry options
- **LoadingState**: Various loading indicators (spinner, skeleton, dots)
- **EmptyState**: Empty data states with call-to-action buttons
- **DataLoader**: Wrapper component that automatically handles loading, error, and empty states

## Hooks

### useErrorHandler
Global error handling hook with notification integration:
```typescript
const { handleError, handleSuccess, handleWarning, handleInfo } = useErrorHandler();

// Handle errors with notifications
handleError(error, {
  showNotification: true,
  fallbackMessage: 'Something went wrong',
  redirectTo: '/dashboard'
});
```

### useApiCall
Manual API calls with built-in error handling:
```typescript
const { data, loading, error, execute } = useApiCall(
  apiFunction,
  {
    showSuccessNotification: true,
    successMessage: 'Action completed!',
    retryCount: 2
  }
);
```

### useApiData
Automatic data fetching with caching:
```typescript
const { data, loading, error, refetch } = useApiData(
  () => api.getData(),
  [dependencies],
  {
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true
  }
);
```

## Error Message Utilities
- User-friendly error message mapping
- Error code to message translation
- HTTP status code handling
- Retryable error detection
- Error severity classification

## API Client Configuration
- Axios interceptors for global error handling
- Automatic token refresh on 401
- Request retry with exponential backoff
- Network error detection
- Custom ApiError class

## Usage Examples

### Basic Data Loading
```tsx
<DataLoader
  loading={loading}
  error={error}
  empty={!data}
  onRetry={refetch}
  errorMessage="Failed to load data"
  emptyMessage="No data available"
>
  <YourComponent data={data} />
</DataLoader>
```

### Form Submission
```tsx
const submitForm = useApiCall(api.submitForm, {
  showSuccessNotification: true,
  successMessage: 'Form submitted successfully!',
  onSuccess: (result) => {
    navigate('/success');
  }
});

const handleSubmit = async (formData) => {
  await submitForm.execute(formData);
};
```

### Global Error Boundary
```tsx
// In App.tsx
<ErrorBoundary>
  <NotificationStack />
  <Routes>
    <Route path="/page" element={
      <PageErrorBoundary>
        <YourPage />
      </PageErrorBoundary>
    } />
  </Routes>
</ErrorBoundary>
```

## Best Practices

1. **Always wrap routes in PageErrorBoundary** to catch component errors
2. **Use DataLoader for consistent UI states** across the application
3. **Provide user-friendly error messages** - avoid technical jargon
4. **Include retry mechanisms** for transient errors (network, server)
5. **Use appropriate hooks**:
   - `useApiData` for data fetching
   - `useApiCall` for user-triggered actions
6. **Show success notifications** for important user actions
7. **Log errors in production** for monitoring and debugging
8. **Handle network errors gracefully** with offline detection
9. **Implement proper cleanup** with abort controllers
10. **Cache API responses** to improve performance and reduce errors

## Error Types and Messages

### Common Error Codes
- `UNAUTHORIZED`: "Please log in to continue."
- `FORBIDDEN`: "You don't have permission to access this resource."
- `NOT_FOUND`: "The requested resource was not found."
- `VALIDATION_ERROR`: "Please check your input and try again."
- `NETWORK_ERROR`: "Unable to connect to the server. Please check your internet connection."
- `SERVER_ERROR`: "Something went wrong on our end. Please try again later."
- `INSUFFICIENT_FUNDS`: "You don't have enough funds for this transaction."
- `RATE_LIMIT_EXCEEDED`: "Too many requests. Please wait a moment and try again."

### Business Logic Errors
- `TRADING_HOURS_CLOSED`: "Trading is currently closed. Please try again during market hours."
- `MINIMUM_INVESTMENT_NOT_MET`: "The minimum investment amount has not been met."
- `PORTFOLIO_LIMIT_EXCEEDED`: "You've reached the maximum number of holdings."

## Implementation Checklist

- [x] Error Boundary components created
- [x] Toast notification system implemented
- [x] Error state UI components built
- [x] Global error handling hook created
- [x] API call hooks with error handling
- [x] User-friendly error messages configured
- [x] API client interceptors set up
- [x] Example component demonstrating patterns
- [x] Documentation completed