import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addNotification } from '@/store/slices/notificationSlice';
import { logout } from '@/store/slices/authSlice';
import { ApiError } from '@/services/api/apiClient';
import { getErrorMessage, ErrorCode } from '@/utils/errorMessages';

export interface ErrorHandlerOptions {
  showNotification?: boolean;
  logError?: boolean;
  redirectTo?: string;
  fallbackMessage?: string;
  onError?: (error: Error) => void;
}

export const useErrorHandler = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleError = useCallback(
    (error: Error | ApiError, options: ErrorHandlerOptions = {}) => {
      const {
        showNotification = true,
        logError = true,
        redirectTo,
        fallbackMessage,
        onError
      } = options;

      // Log error in development
      if (logError && process.env.NODE_ENV === 'development') {
        console.error('Error handled:', error);
      }

      // Handle specific error types
      if (error instanceof ApiError) {
        // Handle authentication errors
        if (error.status === 401) {
          dispatch(logout() as any);
          navigate('/login');
          if (showNotification) {
            dispatch(addNotification({
              type: 'error',
              title: 'Session Expired',
              message: 'Please log in again to continue.'
            }));
          }
          return;
        }

        // Handle forbidden errors
        if (error.status === 403) {
          if (showNotification) {
            dispatch(addNotification({
              type: 'error',
              title: 'Access Denied',
              message: 'You don\'t have permission to perform this action.'
            }));
          }
          if (redirectTo) {
            navigate(redirectTo);
          }
          return;
        }

        // Handle rate limiting
        if (error.status === 429) {
          if (showNotification) {
            dispatch(addNotification({
              type: 'warning',
              title: 'Too Many Requests',
              message: 'Please wait a moment before trying again.'
            }));
          }
          return;
        }

        // Handle validation errors
        if (error.status === 400 && error.details) {
          const validationMessage = formatValidationErrors(error.details);
          if (showNotification) {
            dispatch(addNotification({
              type: 'error',
              title: 'Validation Error',
              message: validationMessage || error.message
            }));
          }
          return;
        }
      }

      // Get user-friendly error message
      const errorMessage = getErrorMessage(error, fallbackMessage);

      // Show notification
      if (showNotification) {
        dispatch(addNotification({
          type: 'error',
          title: 'Error',
          message: errorMessage
        }));
      }

      // Navigate if needed
      if (redirectTo) {
        navigate(redirectTo);
      }

      // Call custom error handler
      if (onError) {
        onError(error);
      }

      // Log to error monitoring service in production
      if (process.env.NODE_ENV === 'production') {
        // TODO: Send to error monitoring service
        console.error('Production error:', {
          error: error.toString(),
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      }
    },
    [dispatch, navigate]
  );

  // Wrapper for async operations
  const handleAsyncError = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      options?: ErrorHandlerOptions
    ): Promise<T | undefined> => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error as Error, options);
        return undefined;
      }
    },
    [handleError]
  );

  // Success handler
  const handleSuccess = useCallback(
    (message: string, title = 'Success') => {
      dispatch(addNotification({
        type: 'success',
        title,
        message
      }));
    },
    [dispatch]
  );

  // Warning handler
  const handleWarning = useCallback(
    (message: string, title = 'Warning') => {
      dispatch(addNotification({
        type: 'warning',
        title,
        message
      }));
    },
    [dispatch]
  );

  // Info handler
  const handleInfo = useCallback(
    (message: string, title = 'Info') => {
      dispatch(addNotification({
        type: 'info',
        title,
        message
      }));
    },
    [dispatch]
  );

  return {
    handleError,
    handleAsyncError,
    handleSuccess,
    handleWarning,
    handleInfo
  };
};

// Helper function to format validation errors
function formatValidationErrors(details: any): string {
  if (Array.isArray(details)) {
    return details.map(error => error.message || error).join(', ');
  }
  if (typeof details === 'object') {
    return Object.entries(details)
      .map(([field, errors]) => {
        const errorMessages = Array.isArray(errors) ? errors : [errors];
        return `${field}: ${errorMessages.join(', ')}`;
      })
      .join('; ');
  }
  return '';
}

export default useErrorHandler;