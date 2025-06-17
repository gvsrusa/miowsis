/**
 * Mock API Response Handlers
 * Utilities for mocking API responses in integration tests
 */

import type { AxiosRequestConfig } from 'axios';
import { TEST_TOKENS, TEST_USERS } from './testSetup';

// Mock response types
export interface MockResponse {
  status: number;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  delay?: number;
}

// Mock handler function type
export type MockHandler = (config: AxiosRequestConfig) => Promise<MockResponse> | MockResponse;

// Default mock handlers for common endpoints
export const defaultMockHandlers: Record<string, MockHandler> = {
  // Auth endpoints
  'POST /api/users/auth/login': (config) => {
    const { email, password } = config.data;
    if (email === TEST_USERS.validUser.email && password === TEST_USERS.validUser.password) {
      return {
        status: 200,
        data: {
          accessToken: TEST_TOKENS.validAccessToken,
          refreshToken: TEST_TOKENS.validRefreshToken,
          user: {
            id: 'user-123',
            email: TEST_USERS.validUser.email,
            firstName: TEST_USERS.validUser.firstName,
            lastName: TEST_USERS.validUser.lastName,
            roles: ['USER']
          }
        }
      };
    }
    return {
      status: 401,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    };
  },

  'POST /api/users/auth/register': (config) => {
    const { email } = config.data;
    if (email === 'existing@example.com') {
      return {
        status: 409,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      };
    }
    return {
      status: 201,
      data: {
        accessToken: TEST_TOKENS.validAccessToken,
        refreshToken: TEST_TOKENS.validRefreshToken,
        user: {
          id: 'user-new',
          email: config.data.email,
          firstName: config.data.firstName,
          lastName: config.data.lastName,
          roles: ['USER']
        }
      }
    };
  },

  'POST /api/users/auth/refresh': (config) => {
    const { refreshToken } = config.data;
    if (refreshToken === TEST_TOKENS.validRefreshToken) {
      return {
        status: 200,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      };
    }
    return {
      status: 401,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid refresh token'
      }
    };
  },

  'POST /api/users/auth/logout': () => ({
    status: 200,
    data: { message: 'Logged out successfully' }
  }),

  // Portfolio endpoints
  'GET /api/portfolio/portfolios/user-123': () => ({
    status: 200,
    data: {
      id: 'portfolio-123',
      userId: 'user-123',
      name: 'Test Portfolio',
      totalValue: 10000.00,
      cashBalance: 1000.00,
      totalReturn: 500.00,
      totalReturnPercentage: 5.26,
      dayChange: 50.00,
      dayChangePercentage: 0.53,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    }
  }),

  'GET /api/portfolio/portfolios/user-123/holdings': () => ({
    status: 200,
    data: {
      content: [
        {
          id: 'holding-1',
          symbol: 'AAPL',
          companyName: 'Apple Inc.',
          quantity: 10,
          avgCostBasis: 150.00,
          currentPrice: 180.00,
          marketValue: 1800.00,
          gainLoss: 300.00,
          gainLossPercentage: 20.00,
          esgScore: 85
        },
        {
          id: 'holding-2',
          symbol: 'MSFT',
          companyName: 'Microsoft Corporation',
          quantity: 5,
          avgCostBasis: 300.00,
          currentPrice: 350.00,
          marketValue: 1750.00,
          gainLoss: 250.00,
          gainLossPercentage: 16.67,
          esgScore: 90
        }
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 20
    }
  }),

  'POST /api/portfolio/portfolios/user-123/buy': (config) => {
    const { symbol, quantity, orderType } = config.data;
    return {
      status: 201,
      data: {
        id: 'transaction-new',
        type: 'BUY',
        symbol,
        quantity,
        price: 180.00,
        totalAmount: quantity * 180.00,
        commission: 0,
        orderType,
        status: 'COMPLETED',
        executedAt: new Date().toISOString()
      }
    };
  },

  'POST /api/portfolio/portfolios/user-123/sell': (config) => {
    const { symbol, quantity } = config.data;
    return {
      status: 201,
      data: {
        id: 'transaction-sell',
        type: 'SELL',
        symbol,
        quantity,
        price: 180.00,
        totalAmount: quantity * 180.00,
        commission: 0,
        status: 'COMPLETED',
        executedAt: new Date().toISOString()
      }
    };
  },

  'POST /api/portfolio/portfolios/user-123/rebalance': () => ({
    status: 200,
    data: {
      currentAllocation: [
        { symbol: 'AAPL', percentage: 60 },
        { symbol: 'MSFT', percentage: 40 }
      ],
      targetAllocation: [
        { symbol: 'AAPL', percentage: 50 },
        { symbol: 'MSFT', percentage: 50 }
      ],
      transactions: [
        {
          type: 'SELL',
          symbol: 'AAPL',
          quantity: 2,
          estimatedPrice: 180.00
        },
        {
          type: 'BUY',
          symbol: 'MSFT',
          quantity: 1,
          estimatedPrice: 350.00
        }
      ],
      estimatedCost: 10.00
    }
  }),

  // AI Chat endpoints
  'POST /api/ai/chat': (config) => ({
    status: 200,
    data: {
      id: 'chat-response-1',
      message: config.data.message,
      response: `AI response to: ${config.data.message}`,
      timestamp: new Date().toISOString()
    }
  })
};

// Create mock axios instance
export const createMockAxios = (handlers: Record<string, MockHandler> = {}) => {
  const mockHandlers = { ...defaultMockHandlers, ...handlers };
  
  const mockAxios: any = jest.fn((config: AxiosRequestConfig) => {
    const key = `${config.method?.toUpperCase()} ${config.url}`;
    const handler = mockHandlers[key];
    
    if (!handler) {
      return Promise.reject(new Error(`No mock handler for ${key}`));
    }
    
    const response = handler(config);
    const responsePromise = Promise.resolve(response);
    
    return responsePromise.then(res => {
      if (res.delay) {
        return new Promise(resolve => 
          setTimeout(() => resolve(res), res.delay)
        );
      }
      
      if (res.error) {
        return Promise.reject({
          response: {
            status: res.status,
            data: { error: res.error }
          }
        });
      }
      
      return {
        status: res.status,
        data: res.data,
        headers: {},
        config
      };
    });
  });

  // Add axios methods
  mockAxios.get = jest.fn((url: string, config?: AxiosRequestConfig) => 
    mockAxios({ ...config, method: 'GET', url })
  );
  
  mockAxios.post = jest.fn((url: string, data?: any, config?: AxiosRequestConfig) => 
    mockAxios({ ...config, method: 'POST', url, data })
  );
  
  mockAxios.put = jest.fn((url: string, data?: any, config?: AxiosRequestConfig) => 
    mockAxios({ ...config, method: 'PUT', url, data })
  );
  
  mockAxios.delete = jest.fn((url: string, config?: AxiosRequestConfig) => 
    mockAxios({ ...config, method: 'DELETE', url })
  );
  
  mockAxios.patch = jest.fn((url: string, data?: any, config?: AxiosRequestConfig) => 
    mockAxios({ ...config, method: 'PATCH', url, data })
  );

  // Add interceptors
  mockAxios.interceptors = {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  };

  // Add create method
  mockAxios.create = jest.fn(() => mockAxios);

  return mockAxios;
};

// Mock SSE for streaming responses
export const createMockSSE = (chunks: string[]) => {
  return {
    body: {
      getReader: () => ({
        read: jest.fn()
          .mockResolvedValueOnce({ 
            done: false, 
            value: new TextEncoder().encode(`data: ${JSON.stringify({ content: chunks[0] })}\n\n`) 
          })
          .mockResolvedValueOnce({ 
            done: false, 
            value: new TextEncoder().encode(`data: ${JSON.stringify({ content: chunks[1] })}\n\n`) 
          })
          .mockResolvedValueOnce({ 
            done: false, 
            value: new TextEncoder().encode('data: [DONE]\n\n') 
          })
          .mockResolvedValueOnce({ done: true }),
        releaseLock: jest.fn()
      })
    },
    ok: true,
    status: 200
  };
};