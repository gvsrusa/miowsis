/**
 * API Configuration
 * Central configuration for all API endpoints and settings
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  
  // API Endpoints by service
  endpoints: {
    // User Service endpoints
    auth: {
      register: '/api/auth/register',
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      verify: '/api/auth/verify',
      verifyEmail: '/api/auth/verify-email',
      forgotPassword: '/api/auth/forgot-password',
      resetPassword: '/api/auth/reset-password'
    },
    
    // Portfolio Service endpoints
    portfolio: {
      get: '/api/portfolio/portfolios',
      holdings: '/api/portfolio/portfolios/:userId/holdings',
      performance: '/api/portfolio/portfolios/:userId/performance',
      buy: '/api/portfolio/portfolios/:userId/buy',
      sell: '/api/portfolio/portfolios/:userId/sell',
      rebalance: '/api/portfolio/portfolios/:userId/rebalance',
      transactions: '/api/portfolio/portfolios/:userId/transactions',
      allocation: '/api/portfolio/portfolios/:userId/allocation',
      roundUp: '/api/portfolio/portfolios/:userId/round-up'
    },
    
    // ESG Service endpoints
    esg: {
      scores: '/api/esg/scores',
      impact: '/api/esg/impact',
      companies: '/api/esg/companies',
      analysis: '/api/esg/analysis',
      recommendations: '/api/esg/recommendations'
    },
    
    // AI Service endpoints
    ai: {
      chat: '/api/ai/chat',
      chatStream: '/api/ai/chat/stream',
      insights: '/api/ai/insights',
      recommendations: '/api/ai/recommendations',
      analysis: '/api/ai/analysis'
    },
    
    // Trading Service endpoints
    trading: {
      orders: '/api/trading/orders',
      orderStatus: '/api/trading/orders/:orderId',
      marketData: '/api/trading/market-data',
      quotes: '/api/trading/quotes',
      search: '/api/trading/search'
    },
    
    // Banking Service endpoints
    banking: {
      accounts: '/api/banking/accounts',
      plaidLink: '/api/banking/plaid/link',
      transactions: '/api/banking/transactions',
      balance: '/api/banking/balance'
    },
    
    // Notification Service endpoints
    notifications: {
      list: '/api/notifications',
      markRead: '/api/notifications/:notificationId/read',
      markAllRead: '/api/notifications/read-all',
      preferences: '/api/notifications/preferences'
    },
    
    // Analytics Service endpoints
    analytics: {
      overview: '/api/analytics/overview',
      performance: '/api/analytics/performance',
      risk: '/api/analytics/risk',
      insights: '/api/analytics/insights'
    }
  },
  
  // Default headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // Retry configuration
  retry: {
    count: 3,
    delay: 1000,
    backoff: 2
  }
};

// Helper function to build URLs with parameters
export const buildUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = endpoint;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }
  return url;
};

// Feature flags from environment
export const FEATURES = {
  AI_ASSISTANT: import.meta.env.VITE_ENABLE_AI_ASSISTANT === 'true',
  BIOMETRIC_AUTH: import.meta.env.VITE_ENABLE_BIOMETRIC_AUTH === 'true',
  ROUND_UP: import.meta.env.VITE_ENABLE_ROUND_UP === 'true'
};

// WebSocket configuration
export const WS_CONFIG = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
  reconnectInterval: 5000,
  maxReconnectAttempts: 5
};