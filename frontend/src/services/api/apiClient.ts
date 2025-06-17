import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '@/config/api.config';
import { store } from '@/store';
import { logout, setTokens } from '@/store/slices/authSlice';
import { optimizedApi, ApiError } from './optimizedApiClient';
import { initializeOptimizations } from './optimizations';

// Re-export ApiError from optimized client
export { ApiError } from './optimizedApiClient';

// Initialize API optimizations
initializeOptimizations({
  enableDeduplication: true,
  enableCaching: true,
  enableBatching: true,
  enablePrefetching: true,
  enableMonitoring: true
});

// Response interceptor for error handling
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID();
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
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
          
          const response = await apiClient.post('/api/users/auth/refresh', { refreshToken });
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
          return apiClient(originalRequest);
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
          resolve(apiClient(originalRequest));
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

// Generic request wrapper with retry logic
async function makeRequest<T>(
  config: AxiosRequestConfig,
  retries = API_CONFIG.retry.count
): Promise<T> {
  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    if (retries > 0 && error instanceof ApiError && error.status >= 500) {
      // Retry for server errors
      await new Promise(resolve => 
        setTimeout(resolve, API_CONFIG.retry.delay * Math.pow(API_CONFIG.retry.backoff, API_CONFIG.retry.count - retries))
      );
      return makeRequest<T>(config, retries - 1);
    }
    throw error;
  }
}

// HTTP method wrappers - use optimized API
export const api = optimizedApi;

export default apiClient;