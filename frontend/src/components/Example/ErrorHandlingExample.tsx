import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
  Alert
} from '@mui/material';
import { DataLoader } from '@components/ErrorStates';
import { useApiCall } from '@/hooks/useApiCall';
import { useApiData } from '@/hooks/useApiData';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { portfolioService } from '@/services/api/portfolioService';
import { ApiError } from '@/services/api/apiClient';

/**
 * Example component demonstrating various error handling patterns
 */
const ErrorHandlingExample: React.FC = () => {
  const [userId] = useState('user123');
  const { handleError, handleSuccess, handleWarning } = useErrorHandler();

  // Example 1: Using useApiData for automatic data fetching with error handling
  const {
    data: portfolio,
    loading: portfolioLoading,
    error: portfolioError,
    refetch: refetchPortfolio
  } = useApiData(
    () => portfolioService.getPortfolio(userId),
    [userId],
    {
      showErrorNotification: true,
      errorMessage: 'Failed to load portfolio data',
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 30 * 1000, // 30 seconds
      onSuccess: (data) => {
        console.log('Portfolio loaded successfully:', data);
      },
      onError: (error) => {
        console.error('Portfolio loading failed:', error);
      }
    }
  );

  // Example 2: Using useApiCall for manual API calls with error handling
  const buySecurities = useApiCall(
    (amount: number) => portfolioService.buySecurities(userId, {
      symbol: 'AAPL',
      quantity: 10,
      orderType: 'MARKET'
    }),
    {
      showSuccessNotification: true,
      successMessage: 'Order placed successfully!',
      showErrorNotification: true,
      onSuccess: (transaction) => {
        // Refetch portfolio after successful purchase
        refetchPortfolio();
      },
      retryCount: 2,
      retryDelay: 1000
    }
  );

  // Example 3: Manual error handling
  const handleManualError = async () => {
    try {
      // Simulate an API error
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'Invalid input provided',
        { field: 'amount', error: 'Must be positive' }
      );
    } catch (error) {
      handleError(error as Error, {
        showNotification: true,
        fallbackMessage: 'Something went wrong with your request'
      });
    }
  };

  // Example 4: Success notification
  const handleSuccessAction = () => {
    handleSuccess('Your settings have been saved successfully!');
  };

  // Example 5: Warning notification
  const handleWarningAction = () => {
    handleWarning('Your portfolio is approaching the risk limit');
  };

  // Example 6: Network error simulation
  const simulateNetworkError = () => {
    const error = new ApiError(
      0,
      'NETWORK_ERROR',
      'Unable to connect to server'
    );
    handleError(error);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Error Handling Examples
      </Typography>

      <Stack spacing={3}>
        {/* Example 1: Data Loading with Error States */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            1. Automatic Data Loading with Error Handling
          </Typography>
          <DataLoader
            loading={portfolioLoading}
            error={portfolioError}
            empty={!portfolio}
            onRetry={refetchPortfolio}
            emptyTitle="No Portfolio Data"
            emptyMessage="Start investing to see your portfolio here"
            errorMessage="Unable to load your portfolio"
          >
            <Box>
              <Typography>Portfolio Value: ${portfolio?.totalValue || 0}</Typography>
              <Button onClick={() => refetchPortfolio()} sx={{ mt: 1 }}>
                Refresh Portfolio
              </Button>
            </Box>
          </DataLoader>
        </Paper>

        {/* Example 2: Manual API Calls */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            2. Manual API Calls with Loading States
          </Typography>
          <Button
            variant="contained"
            onClick={() => buySecurities.execute(1000)}
            disabled={buySecurities.loading}
          >
            {buySecurities.loading ? 'Processing...' : 'Buy Securities ($1000)'}
          </Button>
          {buySecurities.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {buySecurities.error.message}
            </Alert>
          )}
        </Paper>

        {/* Example 3: Notification Examples */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            3. Notification Examples
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleManualError}
            >
              Trigger Error
            </Button>
            <Button
              variant="outlined"
              color="success"
              onClick={handleSuccessAction}
            >
              Show Success
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleWarningAction}
            >
              Show Warning
            </Button>
            <Button
              variant="outlined"
              onClick={simulateNetworkError}
            >
              Network Error
            </Button>
          </Stack>
        </Paper>

        {/* Example 4: Error Boundary Test */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            4. Error Boundary Test
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              throw new Error('Test error boundary!');
            }}
          >
            Throw React Error (Will be caught by Error Boundary)
          </Button>
        </Paper>

        {/* Best Practices */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Error Handling Best Practices
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Use DataLoader for consistent loading/error/empty states"
                secondary="Provides a unified UX for all data fetching scenarios"
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Use useApiData for automatic data fetching"
                secondary="Includes caching, refetching, and automatic error handling"
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Use useApiCall for user-triggered actions"
                secondary="Perfect for form submissions and button clicks"
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Always provide user-friendly error messages"
                secondary="Avoid technical jargon in error notifications"
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Include retry mechanisms for transient errors"
                secondary="Network issues and server errors should be retryable"
              />
            </ListItem>
          </List>
        </Paper>
      </Stack>
    </Box>
  );
};

export default ErrorHandlingExample;