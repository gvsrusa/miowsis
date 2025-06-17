/**
 * API Services Index
 * Central export for all API services
 */

// Export the API client and error class
export { api, ApiError } from './apiClient';

// Export all service instances
export { authService } from '../authService';
export { portfolioService } from './portfolioService';
export { esgService } from './esgService';
export { aiService } from './aiService';
export { tradingService } from './tradingService';
export { notificationService } from './notificationService';

// Export all types
export * from './types';

// Export configuration
export { API_CONFIG, buildUrl, FEATURES, WS_CONFIG } from '@/config/api.config';