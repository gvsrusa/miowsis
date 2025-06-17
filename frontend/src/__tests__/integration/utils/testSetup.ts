/**
 * Integration Test Setup Utilities
 * Common setup and configuration for integration tests
 */

import { configureStore } from '@reduxjs/toolkit';
import { QueryClient } from '@tanstack/react-query';
import authReducer from '@/store/slices/authSlice';
import portfolioReducer from '@/store/slices/portfolioSlice';
import chatReducer from '@/store/slices/chatSlice';
import esgReducer from '@/store/slices/esgSlice';
import notificationReducer from '@/store/slices/notificationSlice';
import onboardingReducer from '@/store/slices/onboardingSlice';

// Test environment configuration
export const TEST_CONFIG = {
  API_BASE_URL: 'http://localhost:8080',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000
};

// Create test store with initial state
export const createTestStore = (initialState?: any) => {
  const rootReducer = {
    auth: authReducer,
    portfolio: portfolioReducer,
    esg: esgReducer,
    notification: notificationReducer,
    onboarding: onboardingReducer,
    chat: chatReducer
  };

  const store = configureStore({
    reducer: rootReducer as any,
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['auth/login/fulfilled'],
          ignoredPaths: ['auth.user']
        }
      })
  });
  return store;
};

// Create test query client
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0
      },
      mutations: {
        retry: false
      }
    }
  });
};

// Test user fixtures
export const TEST_USERS = {
  validUser: {
    email: 'test@example.com',
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User'
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'Admin123!@#',
    firstName: 'Admin',
    lastName: 'User'
  }
};

// Test tokens
export const TEST_TOKENS = {
  validAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  validRefreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwidHlwZSI6InJlZnJlc2gifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  expiredAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIyfQ.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ'
};

// Setup test environment
export const setupTestEnvironment = () => {
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
  global.localStorage = localStorageMock as any;

  // Mock crypto for UUID generation
  global.crypto = {
    randomUUID: jest.fn(() => 'test-uuid-1234')
  } as any;

  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });
};

// Cleanup test environment
export const cleanupTestEnvironment = () => {
  jest.restoreAllMocks();
};

// Wait for async operations
export const waitForAsync = (ms = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Assert API was called with expected parameters
export const expectApiCall = (
  mockFn: jest.Mock,
  method: string,
  url: string,
  data?: any
) => {
  expect(mockFn).toHaveBeenCalledWith(
    expect.objectContaining({
      method,
      url: expect.stringContaining(url),
      ...(data && { data })
    })
  );
};