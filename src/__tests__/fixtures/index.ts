// Export all fixtures from a single entry point
export * from './users.fixture'
export * from './portfolios.fixture'
export * from './transactions.fixture'
export * from './assets.fixture'
export * from './achievements.fixture'

// Test data generators
export const generateTestData = {
  user: (overrides?: any) => {
    const { createMockUser } = require('./users.fixture')
    return createMockUser(overrides)
  },
  portfolio: (userId: string, overrides?: any) => {
    const { createMockPortfolio } = require('./portfolios.fixture')
    return createMockPortfolio(userId, overrides)
  },
  transaction: (userId: string, portfolioId: string, overrides?: any) => {
    const { createMockTransaction } = require('./transactions.fixture')
    return createMockTransaction(userId, portfolioId, overrides)
  },
  asset: (overrides?: any) => {
    const { createMockAsset } = require('./assets.fixture')
    return createMockAsset(overrides)
  },
  achievement: (overrides?: any) => {
    const { createMockAchievement } = require('./achievements.fixture')
    return createMockAchievement(overrides)
  }
}

// Mock Supabase client for testing
export const createMockSupabaseClient = () => {
  const mockFrom = jest.fn()
  const mockSelect = jest.fn()
  const mockInsert = jest.fn()
  const mockUpdate = jest.fn()
  const mockDelete = jest.fn()
  const mockEq = jest.fn()
  const mockNeq = jest.fn()
  const mockGt = jest.fn()
  const mockLt = jest.fn()
  const mockGte = jest.fn()
  const mockLte = jest.fn()
  const mockIn = jest.fn()
  const mockOrder = jest.fn()
  const mockLimit = jest.fn()
  const mockSingle = jest.fn()
  
  // Chain methods together
  const mockChain = {
    select: mockSelect.mockReturnThis(),
    insert: mockInsert.mockReturnThis(),
    update: mockUpdate.mockReturnThis(),
    delete: mockDelete.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    neq: mockNeq.mockReturnThis(),
    gt: mockGt.mockReturnThis(),
    lt: mockLt.mockReturnThis(),
    gte: mockGte.mockReturnThis(),
    lte: mockLte.mockReturnThis(),
    in: mockIn.mockReturnThis(),
    order: mockOrder.mockReturnThis(),
    limit: mockLimit.mockReturnThis(),
    single: mockSingle.mockReturnThis(),
  }
  
  // Apply chain to all methods
  Object.values(mockChain).forEach(method => {
    Object.assign(method, mockChain)
  })
  
  mockFrom.mockReturnValue(mockChain)
  
  return {
    from: mockFrom,
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn(),
      }),
    },
    // Expose chain methods for assertions
    _chain: mockChain,
  }
}

// Common test utilities
export const testUtils = {
  // Wait for async operations
  waitForAsync: (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock fetch responses
  mockFetchResponse: (data: any, status = 200) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
    })
  },
  
  // Mock Next.js router
  mockRouter: (overrides = {}) => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    ...overrides,
  }),
  
  // Mock session
  mockSessionContext: (session: any = null) => ({
    data: session,
    status: session ? 'authenticated' : 'unauthenticated',
    update: jest.fn(),
  }),
}