import { mockUsers } from './users.fixture'

export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  category: 'trading' | 'portfolio' | 'education' | 'social' | 'milestone'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  points: number
  icon: string
  requirements: Record<string, any>
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  progress: number
  metadata: Record<string, any>
}

export const mockAchievements: Record<string, Achievement> = {
  firstTrade: {
    id: 'ach-first-trade',
    code: 'FIRST_TRADE',
    name: 'First Trade',
    description: 'Complete your first trade',
    category: 'trading',
    tier: 'bronze',
    points: 10,
    icon: '🎯',
    requirements: {
      trades_count: 1
    },
    created_at: '2023-01-01T00:00:00Z'
  },
  portfolioDiversified: {
    id: 'ach-diversified',
    code: 'PORTFOLIO_DIVERSIFIED',
    name: 'Diversified Portfolio',
    description: 'Hold at least 5 different assets',
    category: 'portfolio',
    tier: 'silver',
    points: 25,
    icon: '🌐',
    requirements: {
      unique_assets: 5
    },
    created_at: '2023-01-01T00:00:00Z'
  },
  profitMaker: {
    id: 'ach-profit-maker',
    code: 'PROFIT_MAKER',
    name: 'Profit Maker',
    description: 'Achieve 10% returns on your portfolio',
    category: 'trading',
    tier: 'gold',
    points: 50,
    icon: '💰',
    requirements: {
      returns_percentage: 10
    },
    created_at: '2023-01-01T00:00:00Z'
  },
  esgChampion: {
    id: 'ach-esg-champion',
    code: 'ESG_CHAMPION',
    name: 'ESG Champion',
    description: 'Maintain a portfolio ESG score above 80',
    category: 'portfolio',
    tier: 'gold',
    points: 40,
    icon: '🌱',
    requirements: {
      esg_score: 80
    },
    created_at: '2023-01-01T00:00:00Z'
  },
  tradingStreak: {
    id: 'ach-trading-streak',
    code: 'TRADING_STREAK',
    name: 'Trading Streak',
    description: 'Trade for 30 consecutive days',
    category: 'trading',
    tier: 'platinum',
    points: 100,
    icon: '🔥',
    requirements: {
      consecutive_days: 30
    },
    created_at: '2023-01-01T00:00:00Z'
  }
}

export const mockUserAchievements: UserAchievement[] = [
  {
    id: 'user-ach-123',
    user_id: mockUsers.testUser.id,
    achievement_id: mockAchievements.firstTrade.id,
    earned_at: '2024-01-05T10:30:00Z',
    progress: 100,
    metadata: {
      trade_id: 'txn-buy-123',
      asset_symbol: 'AAPL'
    }
  },
  {
    id: 'user-ach-456',
    user_id: mockUsers.testUser.id,
    achievement_id: mockAchievements.portfolioDiversified.id,
    earned_at: '2024-01-10T15:00:00Z',
    progress: 100,
    metadata: {
      assets_count: 5,
      portfolio_id: 'portfolio-123'
    }
  },
  {
    id: 'user-ach-789',
    user_id: mockUsers.testUser.id,
    achievement_id: mockAchievements.tradingStreak.id,
    earned_at: '',
    progress: 45, // 45% progress (13.5 days out of 30)
    metadata: {
      current_streak: 13,
      last_trade_date: '2024-01-15'
    }
  }
]

export const createMockAchievement = (overrides?: Partial<Achievement>): Achievement => {
  return {
    ...mockAchievements.firstTrade,
    id: `ach-${Date.now()}`,
    code: `ACHIEVEMENT_${Date.now()}`,
    created_at: new Date().toISOString(),
    ...overrides
  }
}

export const mockUserStats = {
  user_id: mockUsers.testUser.id,
  total_points: 75,
  achievements_earned: 2,
  achievements_in_progress: 3,
  current_level: 2,
  next_level_points: 100,
  rank: 'Silver Investor',
  percentile: 85,
  streaks: {
    trading_days: 13,
    login_days: 25,
    profit_days: 5
  }
}