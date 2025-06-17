import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { store } from '@/store';
import { refreshAccessToken, logout } from '@store/slices/authSlice';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token, logout user
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        // Attempt to refresh token
        const result = await store.dispatch(refreshAccessToken(refreshToken)).unwrap();
        const newAccessToken = result.accessToken;
        
        // Update the failed request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        processQueue(null, newAccessToken);
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError as AxiosError, null);
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

// Export specific HTTP methods for convenience
export const api = {
  get: <T = any>(url: string, config?: any) => 
    axiosInstance.get<T>(url, config),
  
  post: <T = any>(url: string, data?: any, config?: any) => 
    axiosInstance.post<T>(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: any) => 
    axiosInstance.put<T>(url, data, config),
  
  patch: <T = any>(url: string, data?: any, config?: any) => 
    axiosInstance.patch<T>(url, data, config),
  
  delete: <T = any>(url: string, config?: any) => 
    axiosInstance.delete<T>(url, config),
};