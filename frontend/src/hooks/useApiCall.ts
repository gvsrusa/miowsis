import { useState, useCallback, useRef, useEffect } from 'react';
import { useErrorHandler } from './useErrorHandler';
import { ApiError } from '@/services/api/apiClient';

interface UseApiCallOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error | ApiError) => void;
  showSuccessNotification?: boolean;
  successMessage?: string;
  showErrorNotification?: boolean;
  errorMessage?: string;
  retryCount?: number;
  retryDelay?: number;
}

interface UseApiCallResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | ApiError | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApiCall<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiCallOptions<T> = {}
): UseApiCallResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | ApiError | null>(null);
  const { handleError, handleSuccess } = useErrorHandler();
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    onSuccess,
    onError,
    showSuccessNotification = false,
    successMessage,
    showErrorNotification = true,
    errorMessage,
    retryCount = 0,
    retryDelay = 1000
  } = options;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      let attempts = 0;
      const maxAttempts = retryCount + 1;

      while (attempts < maxAttempts) {
        try {
          const result = await apiFunction(...args);
          
          setData(result);
          setLoading(false);

          // Handle success
          if (onSuccess) {
            onSuccess(result);
          }

          if (showSuccessNotification && successMessage) {
            handleSuccess(successMessage);
          }

          return result;
        } catch (err) {
          attempts++;

          // Check if request was aborted
          if (err instanceof Error && err.name === 'AbortError') {
            setLoading(false);
            return null;
          }

          // If this isn't the last attempt and error is retryable, wait and retry
          if (attempts < maxAttempts && isRetryableError(err as Error | ApiError)) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
            continue;
          }

          // Final error handling
          const error = err as Error | ApiError;
          setError(error);
          setLoading(false);

          // Handle error
          if (onError) {
            onError(error);
          }

          if (showErrorNotification) {
            handleError(error, {
              fallbackMessage: errorMessage,
              showNotification: true
            });
          }

          return null;
        }
      }

      return null;
    },
    [apiFunction, onSuccess, onError, showSuccessNotification, successMessage, 
     showErrorNotification, errorMessage, handleError, handleSuccess, retryCount, retryDelay]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}

// Helper to determine if error is retryable
function isRetryableError(error: Error | ApiError): boolean {
  if (error instanceof ApiError) {
    // Retry on server errors and rate limiting (with backoff)
    return error.status >= 500 || error.status === 429;
  }
  // Retry on network errors
  return error.message.includes('Network') || error.message.includes('fetch');
}

export default useApiCall;