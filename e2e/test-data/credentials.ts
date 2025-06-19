/**
 * Test credentials and comprehensive user scenarios for E2E testing
 */

export interface TestCredentials {
  email: string
  password?: string
  name: string
  role: 'user' | 'admin'
  profile: {
    kyc_status: 'pending' | 'verified' | 'rejected'
    onboarding_completed: boolean
    risk_profile?: {
      risk_tolerance: 'conservative' | 'moderate' | 'aggressive'
      investment_horizon: 'short-term' | 'medium-term' | 'long-term'
      investment_goals: string[]
      experience_level: 'beginner' | 'intermediate' | 'expert'
    }
  }
}

export const testCredentials: Record<string, TestCredentials> = {
  // Standard verified user for main flow testing
  verifiedUser: {
    email: 'test.user@miowsis-e2e.com',
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'user',
    profile: {
      kyc_status: 'verified',
      onboarding_completed: true,
      risk_profile: {
        risk_tolerance: 'moderate',
        investment_horizon: 'long-term',
        investment_goals: ['growth', 'income'],
        experience_level: 'intermediate'
      }
    }
  },

  // New user for onboarding flow testing
  newUser: {
    email: 'new.user@miowsis-e2e.com',
    password: 'NewUserPass123!',
    name: 'New User',
    role: 'user',
    profile: {
      kyc_status: 'pending',
      onboarding_completed: false
    }
  },

  // Admin user for administrative functions
  adminUser: {
    email: 'admin@miowsis-e2e.com',
    password: 'AdminSecure123!',
    name: 'Admin User',
    role: 'admin',
    profile: {
      kyc_status: 'verified',
      onboarding_completed: true,
      risk_profile: {
        risk_tolerance: 'aggressive',
        investment_horizon: 'long-term',
        investment_goals: ['growth'],
        experience_level: 'expert'
      }
    }
  },

  // Conservative investor for risk profile testing
  conservativeUser: {
    email: 'conservative@miowsis-e2e.com',
    password: 'ConservativePass123!',
    name: 'Conservative Investor',
    role: 'user',
    profile: {
      kyc_status: 'verified',
      onboarding_completed: true,
      risk_profile: {
        risk_tolerance: 'conservative',
        investment_horizon: 'short-term',
        investment_goals: ['income', 'capital-preservation'],
        experience_level: 'beginner'
      }
    }
  },

  // Aggressive investor for high-risk testing
  aggressiveUser: {
    email: 'aggressive@miowsis-e2e.com',
    password: 'AggressivePass123!',
    name: 'Aggressive Investor',
    role: 'user',
    profile: {
      kyc_status: 'verified',
      onboarding_completed: true,
      risk_profile: {
        risk_tolerance: 'aggressive',
        investment_horizon: 'long-term',
        investment_goals: ['growth', 'speculation'],
        experience_level: 'expert'
      }
    }
  },

  // User with rejected KYC for error flow testing
  rejectedKycUser: {
    email: 'rejected@miowsis-e2e.com',
    password: 'RejectedPass123!',
    name: 'Rejected User',
    role: 'user',
    profile: {
      kyc_status: 'rejected',
      onboarding_completed: false
    }
  },

  // User for Google OAuth testing (no password)
  googleUser: {
    email: 'google.user@miowsis-e2e.com',
    name: 'Google Test User',
    role: 'user',
    profile: {
      kyc_status: 'pending',
      onboarding_completed: false
    }
  },

  // User for email magic link testing (no password)
  emailLinkUser: {
    email: 'email.link@miowsis-e2e.com',
    name: 'Magic Link User',
    role: 'user',
    profile: {
      kyc_status: 'verified',
      onboarding_completed: true,
      risk_profile: {
        risk_tolerance: 'moderate',
        investment_horizon: 'medium-term',
        investment_goals: ['growth'],
        experience_level: 'intermediate'
      }
    }
  }
}

// Test environment configuration
export const testEnvironment = {
  baseUrl: 'http://localhost:3000',
  apiTimeout: 10000,
  defaultPassword: 'DefaultTestPass123!',
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key'
  }
}

// Portfolio test data for different user scenarios
export const testPortfolios = {
  starter: {
    name: 'Starter Portfolio',
    initialDeposit: 1000,
    targetAssets: ['AAPL', 'SPY', 'BND']
  },
  moderate: {
    name: 'Balanced Growth',
    initialDeposit: 10000,
    targetAssets: ['AAPL', 'GOOGL', 'MSFT', 'SPY', 'VTI', 'BND']
  },
  aggressive: {
    name: 'High Growth',
    initialDeposit: 50000,
    targetAssets: ['TSLA', 'NVDA', 'AMZN', 'QQQ', 'ARKK']
  },
  conservative: {
    name: 'Conservative Income',
    initialDeposit: 25000,
    targetAssets: ['BND', 'VYM', 'SCHD', 'T', 'JNJ']
  }
}

// Test transaction scenarios
export const testTransactions = {
  smallBuy: {
    type: 'buy' as const,
    symbol: 'AAPL',
    quantity: 1,
    orderType: 'market'
  },
  largeBuy: {
    type: 'buy' as const,
    symbol: 'GOOGL',
    quantity: 10,
    orderType: 'limit',
    limitPrice: 2950.00
  },
  partialSell: {
    type: 'sell' as const,
    symbol: 'AAPL',
    quantity: 5,
    orderType: 'market'
  },
  stopLoss: {
    type: 'sell' as const,
    symbol: 'TSLA',
    quantity: 2,
    orderType: 'stop-loss',
    stopPrice: 240.00
  }
}

// Common test scenarios for comprehensive flow testing
export const testScenarios = {
  fullOnboarding: {
    user: testCredentials.newUser,
    steps: [
      'register',
      'verify-email',
      'complete-kyc',
      'risk-assessment',
      'create-portfolio',
      'fund-account',
      'first-investment'
    ]
  },
  portfolioManagement: {
    user: testCredentials.verifiedUser,
    steps: [
      'login',
      'view-dashboard',
      'create-portfolio',
      'buy-assets',
      'rebalance',
      'sell-assets',
      'view-performance'
    ]
  },
  tradingFlow: {
    user: testCredentials.aggressiveUser,
    steps: [
      'login',
      'search-assets',
      'place-buy-order',
      'monitor-position',
      'set-alerts',
      'place-sell-order',
      'view-transactions'
    ]
  },
  riskManagement: {
    user: testCredentials.conservativeUser,
    steps: [
      'login',
      'review-risk-profile',
      'set-risk-limits',
      'diversify-portfolio',
      'monitor-risk-metrics',
      'adjust-allocations'
    ]
  },
  adminOperations: {
    user: testCredentials.adminUser,
    steps: [
      'admin-login',
      'view-user-dashboard',
      'manage-portfolios',
      'system-monitoring',
      'user-support',
      'compliance-checks'
    ]
  }
}

// Test data validation helpers
export function validateCredentials(credentials: TestCredentials): boolean {
  return !!(
    credentials.email &&
    credentials.name &&
    credentials.role &&
    credentials.profile.kyc_status
  )
}

export function getCredentialsByRole(role: 'user' | 'admin'): TestCredentials[] {
  return Object.values(testCredentials).filter(cred => cred.role === role)
}

export function getCredentialsByKycStatus(status: 'pending' | 'verified' | 'rejected'): TestCredentials[] {
  return Object.values(testCredentials).filter(cred => cred.profile.kyc_status === status)
}

// Test data generators for dynamic scenarios
export function generateTestUser(overrides: Partial<TestCredentials> = {}): TestCredentials {
  const timestamp = Date.now()
  return {
    email: `test.user.${timestamp}@miowsis-e2e.com`,
    password: `TestPass${timestamp}!`,
    name: `Test User ${timestamp}`,
    role: 'user',
    profile: {
      kyc_status: 'verified',
      onboarding_completed: true,
      risk_profile: {
        risk_tolerance: 'moderate',
        investment_horizon: 'long-term',
        investment_goals: ['growth'],
        experience_level: 'intermediate'
      }
    },
    ...overrides
  }
}