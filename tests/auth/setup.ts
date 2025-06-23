import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  },
  writable: true
});

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console errors and warnings during tests unless they're test-related
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || 
       args[0].includes('Error:') ||
       args[0].includes('Test'))
    ) {
      originalConsoleError(...args);
    }
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Test')
    ) {
      originalConsoleWarn(...args);
    }
  };
});

afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset localStorage mock
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.clear.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  
  // Reset sessionStorage mock
  sessionStorageMock.clear.mockClear();
  sessionStorageMock.getItem.mockReturnValue(null);
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
});

afterEach(() => {
  // Clean up after each test
  cleanup();
  vi.clearAllTimers();
});

// Global test utilities
global.testUser = {
  id: 'test-user-123',
  email: 'test@miowsis.com',
  firstName: 'John',
  lastName: 'Doe',
  emailVerified: true,
  kycStatus: 'pending' as const,
  onboardingComplete: false,
  biometricEnabled: false
};

global.mockAuthResponse = {
  user: global.testUser,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token'
};

// Custom matchers for authentication testing
expect.extend({
  toBeAuthenticated(received) {
    const pass = received.isAuthenticated === true && received.user !== null;
    if (pass) {
      return {
        message: () => `Expected user not to be authenticated`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected user to be authenticated`,
        pass: false
      };
    }
  },
  
  toHaveValidTokens(received) {
    const pass = received.token && received.refreshToken;
    if (pass) {
      return {
        message: () => `Expected user not to have valid tokens`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected user to have valid tokens`,
        pass: false
      };
    }
  }
});

// Declare custom matchers for TypeScript
declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toBeAuthenticated(): T;
      toHaveValidTokens(): T;
    }
  }
}