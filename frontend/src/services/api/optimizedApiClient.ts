import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/config/api.config';
import { store } from '@/store';
import { logout, setTokens } from '@/store/slices/authSlice';
import {
  requestDeduplicator,
  getCacheInstance,
  performanceMonitor,
  requestPrefetcher
} from './optimizations';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Response interceptor for error handling
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Create optimized axios instance
const optimizedApiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers
});

// Request interceptor for optimization and authentication
optimizedApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add authentication
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    const requestId = crypto.randomUUID();
    config.headers['X-Request-ID'] = requestId;
    
    // Start performance monitoring
    performanceMonitor.startRequest(config);
    
    // Check deduplication
    if (config.method === 'GET' && requestDeduplicator.isPending(config)) {
      // Return the pending request promise
      const pendingRequest = requestDeduplicator.getPendingRequest(config);
      if (pendingRequest) {
        return Promise.reject({
          __pending: true,
          promise: pendingRequest,
          requestId
        });
      }
    }
    
    // Check cache for GET requests
    if (config.method === 'GET') {
      const cache = getCacheInstance(config.url || '');
      const cachedResponse = cache.get(config);
      
      if (cachedResponse) {
        // End monitoring for cached response
        performanceMonitor.endRequest(requestId, cachedResponse, true);
        
        // Return cached response
        return Promise.reject({
          __cached: true,
          response: cachedResponse,
          requestId
        });
      }
      
      // Add ETag if available
      const etag = cache.getEtag(config);
      if (etag && config.headers) {
        config.headers['If-None-Match'] = etag;
      }
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for caching and error handling
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

optimizedApiClient.interceptors.response.use(
  (response) => {
    const requestId = response.config.headers?.['X-Request-ID'];
    
    // End performance monitoring
    if (requestId) {
      performanceMonitor.endRequest(requestId, response);
    }
    
    // Cache successful GET responses
    if (response.config.method === 'GET' && response.status === 200) {
      const cache = getCacheInstance(response.config.url || '');
      cache.set(response.config, response);
    }
    
    // Handle 304 Not Modified
    if (response.status === 304) {
      const cache = getCacheInstance(response.config.url || '');
      cache.updateTimestamp(response.config);
      const cachedResponse = cache.get(response.config);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    return response;
  },
  async (error: AxiosError<ErrorResponse>) => {
    // Handle special cases from request interceptor
    if (error && typeof error === 'object' && '__pending' in error) {
      // Return the pending request
      return (error as any).promise;
    }
    
    if (error && typeof error === 'object' && '__cached' in error) {
      // Return the cached response
      return (error as any).response;
    }
    
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestId = originalRequest?.headers?.['X-Request-ID'];
    
    // End performance monitoring for failed request
    if (requestId) {
      performanceMonitor.endRequestWithError(requestId, error);
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/refresh')) {
        // Refresh token is also invalid, logout user
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }
          
          const response = await optimizedApiClient.post('/api/users/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          store.dispatch(setTokens({ accessToken, refreshToken: newRefreshToken }));
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          onTokenRefreshed(accessToken);
          isRefreshing = false;
          
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return optimizedApiClient(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          store.dispatch(logout());
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      
      // Wait for token refresh to complete
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          resolve(optimizedApiClient(originalRequest));
        });
      });
    }
    
    // Transform error to ApiError
    if (error.response) {
      const errorData = error.response.data?.error || {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred'
      };
      
      throw new ApiError(
        error.response.status,
        errorData.code,
        errorData.message,
        errorData.details
      );
    } else if (error.request) {
      // Network error
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        'Unable to connect to the server. Please check your internet connection.'
      );
    } else {
      // Other errors
      throw new ApiError(
        0,
        'CLIENT_ERROR',
        error.message || 'An unexpected error occurred'
      );
    }
  }
);

// Generic request wrapper with retry logic and deduplication
async function makeOptimizedRequest<T>(
  config: AxiosRequestConfig,
  retries = API_CONFIG.retry.count
): Promise<T> {
  try {
    // For GET requests, track in deduplicator
    if (config.method === 'GET') {
      const pendingRequest = requestDeduplicator.getPendingRequest<T>(config);
      if (pendingRequest) {
        return pendingRequest;
      }
      
      // Create the request promise
      const requestPromise = optimizedApiClient(config).then(response => response.data);
      
      // Add to deduplicator
      requestDeduplicator.addPending(config, requestPromise);
      
      return requestPromise;
    }
    
    // For non-GET requests, execute directly
    const response = await optimizedApiClient(config);
    return response.data;
  } catch (error) {
    if (retries > 0 && error instanceof ApiError && error.status >= 500) {
      // Retry for server errors
      await new Promise(resolve => 
        setTimeout(resolve, API_CONFIG.retry.delay * Math.pow(API_CONFIG.retry.backoff, API_CONFIG.retry.count - retries))
      );
      return makeOptimizedRequest<T>(config, retries - 1);
    }
    throw error;
  }
}

// HTTP method wrappers with optimizations
export const optimizedApi = {
  get: <T>(url: string, config?: AxiosRequestConfig) => {
    // Trigger prefetch for the current route
    requestPrefetcher.triggerPrefetch(url);
    
    return makeOptimizedRequest<T>({ ...config, method: 'GET', url });
  },
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    makeOptimizedRequest<T>({ ...config, method: 'POST', url, data }),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    makeOptimizedRequest<T>({ ...config, method: 'PUT', url, data }),
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    makeOptimizedRequest<T>({ ...config, method: 'PATCH', url, data }),
    
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    makeOptimizedRequest<T>({ ...config, method: 'DELETE', url }),
    
  // Special method for file uploads
  upload: <T>(url: string, formData: FormData, config?: AxiosRequestConfig) => 
    makeOptimizedRequest<T>({
      ...config,
      method: 'POST',
      url,
      data: formData,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data'
      }
    }),
  
  // Prefetch data
  prefetch: (url: string, params?: any) => {
    requestPrefetcher.prefetch(url, { priority: 'high' }, params);
  },
  
  // Clear cache for specific endpoint
  clearCache: (url: string, params?: any) => {
    const cache = getCacheInstance(url);
    cache.delete({ method: 'GET', url, params });
  },
  
  // Get performance stats
  getStats: () => performanceMonitor.getStats(),
  
  // Get endpoint stats
  getEndpointStats: () => performanceMonitor.getEndpointStats()
};

export default optimizedApiClient;