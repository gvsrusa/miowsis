import { useEffect, useRef } from 'react';
import { useApiCall } from './useApiCall';
import { ApiError } from '@/services/api/apiClient';

interface UseApiDataOptions<T> {
  // Fetching options
  enabled?: boolean;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  
  // Caching options
  cacheTime?: number;
  staleTime?: number;
  cacheKey?: string;
  
  // Error handling
  onSuccess?: (data: T) => void;
  onError?: (error: Error | ApiError) => void;
  showErrorNotification?: boolean;
  errorMessage?: string;
  
  // Retry options
  retryCount?: number;
  retryDelay?: number;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

export function useApiData<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiDataOptions<T> = {}
) {
  const {
    enabled = true,
    refetchInterval,
    refetchOnWindowFocus = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 0,
    cacheKey,
    ...apiCallOptions
  } = options;

  const { data, loading, error, execute, reset } = useApiCall(apiFunction, apiCallOptions);
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastFetchTime = useRef<number>(0);

  // Generate cache key
  const getCacheKey = () => {
    if (cacheKey) return cacheKey;
    return `${apiFunction.toString()}-${JSON.stringify(dependencies)}`;
  };

  // Check if data is stale
  const isStale = () => {
    if (staleTime === 0) return true;
    return Date.now() - lastFetchTime.current > staleTime;
  };

  // Fetch data
  const fetchData = async (bypassCache = false) => {
    const key = getCacheKey();
    
    // Check cache first
    if (!bypassCache && cacheTime > 0) {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        // Use cached data if not stale
        if (!isStale()) {
          return cached.data;
        }
      }
    }

    // Fetch fresh data
    const result = await execute();
    
    if (result !== null && cacheTime > 0) {
      // Update cache
      cache.set(key, {
        data: result,
        timestamp: Date.now()
      });
      lastFetchTime.current = Date.now();
    }

    return result;
  };

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [...dependencies, enabled]);

  // Set up refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData(true); // Bypass cache for interval refetches
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled]);

  // Refetch on window focus
  useEffect(() => {
    if (refetchOnWindowFocus && enabled) {
      const handleFocus = () => {
        if (isStale()) {
          fetchData();
        }
      };

      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [refetchOnWindowFocus, enabled]);

  // Manual refetch function
  const refetch = (bypassCache = true) => {
    return fetchData(bypassCache);
  };

  // Clear cache for this query
  const clearCache = () => {
    const key = getCacheKey();
    cache.delete(key);
  };

  return {
    data,
    loading,
    error,
    refetch,
    reset,
    clearCache,
    isStale: isStale()
  };
}

// Clear all cache
export function clearAllCache() {
  cache.clear();
}

// Clear expired cache entries
export function clearExpiredCache(maxAge = 10 * 60 * 1000) {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > maxAge) {
      cache.delete(key);
    }
  }
}

export default useApiData;