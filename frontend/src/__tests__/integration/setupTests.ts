/**
 * Integration Test Setup
 * Global setup for all integration tests
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { 
  mockIntersectionObserver, 
  mockResizeObserver, 
  mockMatchMedia,
  setupWebSocketMock,
  cleanupWebSocketMock
} from './utils/testHelpers';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveBeenCalledWithMatch(expected: any): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toHaveBeenCalledWithMatch(received: jest.Mock, expected: any) {
    const calls = received.mock.calls;
    const pass = calls.some(call => 
      JSON.stringify(call).includes(JSON.stringify(expected))
    );
    
    if (pass) {
      return {
        message: () => `expected mock not to have been called with matching ${JSON.stringify(expected)}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected mock to have been called with matching ${JSON.stringify(expected)}`,
        pass: false,
      };
    }
  }
});

// Global test setup
beforeAll(() => {
  // Mock browser APIs
  mockIntersectionObserver();
  mockResizeObserver();
  mockMatchMedia();
  setupWebSocketMock();
  
  // Mock console methods to reduce noise
  global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  };
  
  // Mock window.scrollTo
  window.scrollTo = jest.fn();
  
  // Mock navigator
  Object.defineProperty(window, 'navigator', {
    value: {
      onLine: true,
      language: 'en-US',
      userAgent: 'Mozilla/5.0 (Testing) Chrome/999.0.0.0'
    },
    writable: true
  });
  
  // Mock performance API
  Object.defineProperty(window, 'performance', {
    value: {
      now: jest.fn(() => Date.now()),
      measure: jest.fn(),
      mark: jest.fn(),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn()
    },
    writable: true
  });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Global teardown
afterAll(() => {
  cleanupWebSocketMock();
  jest.restoreAllMocks();
});

// Suppress specific warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress React Router warnings in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('You should not use')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Export test utilities
export * from './utils/testSetup';
export * from './utils/mockHandlers';
export * from './utils/testHelpers';