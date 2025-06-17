import { ApiError } from '@/services/api/apiClient';

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Authorization errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // Business logic errors
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  TRADING_HOURS_CLOSED = 'TRADING_HOURS_CLOSED',
  MINIMUM_INVESTMENT_NOT_MET = 'MINIMUM_INVESTMENT_NOT_MET',
  PORTFOLIO_LIMIT_EXCEEDED = 'PORTFOLIO_LIMIT_EXCEEDED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// User-friendly error messages
const errorMessages: Record<string, string> = {
  // Authentication
  [ErrorCode.UNAUTHORIZED]: 'Please log in to continue.',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  
  // Authorization
  [ErrorCode.FORBIDDEN]: 'You don\'t have permission to access this resource.',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You don\'t have the required permissions.',
  
  // Validation
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCode.INVALID_INPUT]: 'The provided input is invalid.',
  [ErrorCode.REQUIRED_FIELD_MISSING]: 'Please fill in all required fields.',
  
  // Resources
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'The item you\'re looking for doesn\'t exist.',
  [ErrorCode.ALREADY_EXISTS]: 'This item already exists.',
  
  // Server
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable. Please try again later.',
  [ErrorCode.DATABASE_ERROR]: 'We\'re having trouble accessing our data. Please try again.',
  
  // Network
  [ErrorCode.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection.',
  [ErrorCode.TIMEOUT_ERROR]: 'The request took too long. Please try again.',
  [ErrorCode.CONNECTION_ERROR]: 'Connection error. Please check your internet and try again.',
  
  // Business logic
  [ErrorCode.INSUFFICIENT_FUNDS]: 'You don\'t have enough funds for this transaction.',
  [ErrorCode.TRADING_HOURS_CLOSED]: 'Trading is currently closed. Please try again during market hours.',
  [ErrorCode.MINIMUM_INVESTMENT_NOT_MET]: 'The minimum investment amount has not been met.',
  [ErrorCode.PORTFOLIO_LIMIT_EXCEEDED]: 'You\'ve reached the maximum number of holdings.',
  
  // Rate limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.',
  
  // Unknown
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};

// HTTP status code to error code mapping
const statusCodeMapping: Record<number, ErrorCode> = {
  400: ErrorCode.VALIDATION_ERROR,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.ALREADY_EXISTS,
  429: ErrorCode.RATE_LIMIT_EXCEEDED,
  500: ErrorCode.INTERNAL_SERVER_ERROR,
  502: ErrorCode.SERVICE_UNAVAILABLE,
  503: ErrorCode.SERVICE_UNAVAILABLE,
  504: ErrorCode.TIMEOUT_ERROR
};

/**
 * Get a user-friendly error message based on the error
 */
export function getErrorMessage(
  error: Error | ApiError | unknown,
  fallbackMessage?: string
): string {
  // Handle ApiError
  if (error instanceof ApiError) {
    // Try to get message by error code
    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code];
    }
    
    // Try to get message by status code
    const errorCode = statusCodeMapping[error.status];
    if (errorCode && errorMessages[errorCode]) {
      return errorMessages[errorCode];
    }
    
    // Use the error message if it's user-friendly
    if (error.message && !error.message.includes('Error:')) {
      return error.message;
    }
  }
  
  // Handle regular Error
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return errorMessages[ErrorCode.NETWORK_ERROR];
    }
    
    // Check for timeout errors
    if (error.message.includes('timeout')) {
      return errorMessages[ErrorCode.TIMEOUT_ERROR];
    }
    
    // Use error message if it seems user-friendly
    if (error.message && error.message.length < 100 && !error.message.includes('Error:')) {
      return error.message;
    }
  }
  
  // Return fallback message or generic error
  return fallbackMessage || errorMessages[ErrorCode.UNKNOWN_ERROR];
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error | ApiError): boolean {
  if (error instanceof ApiError) {
    // Retry on server errors and timeouts
    return error.status >= 500 || error.status === 408 || error.status === 429;
  }
  
  // Retry on network errors
  if (error instanceof Error) {
    return error.message.includes('Network') || 
           error.message.includes('fetch') ||
           error.message.includes('timeout');
  }
  
  return false;
}

/**
 * Get error severity for logging/monitoring
 */
export function getErrorSeverity(error: Error | ApiError): 'low' | 'medium' | 'high' | 'critical' {
  if (error instanceof ApiError) {
    if (error.status >= 500) return 'critical';
    if (error.status === 429) return 'medium';
    if (error.status >= 400 && error.status < 500) return 'low';
  }
  
  return 'medium';
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: Error | ApiError): object {
  const baseInfo = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack
  };
  
  if (error instanceof ApiError) {
    return {
      ...baseInfo,
      type: 'ApiError',
      status: error.status,
      code: error.code,
      details: error.details
    };
  }
  
  return {
    ...baseInfo,
    type: error.name || 'Error'
  };
}