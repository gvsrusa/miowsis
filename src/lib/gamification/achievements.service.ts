import { createClient } from '@/lib/supabase/server'

export type AchievementCategory = 'investment' | 'esg' | 'streak' | 'education' | 'social'
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  rarity: AchievementRarity
  icon: string
  points: number
  requirement: {
    type: string
    value: number
    current?: number
  }
  unlockedAt?: string
  progress?: number
}

export interface UserStats {
  totalInvested: number
  totalReturns: number
  portfolioCount: number
  holdingsCount: number
  transactionCount: number
  esgAverageScore: number
  investmentStreak: number
  totalPoints: number
  level: number
  nextLevelPoints: number
}

export interface LeaderboardEntry {
  userId: string
  username: string
  avatar?: string
  totalPoints: number
  level: number
  rank: number
  topAchievement?: string
}

const ACHIEVEMENTS_CATALOG: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
  // Investment Achievements
  {
    id: 'first_investment',
    name: 'First Steps',
    description: 'Make your first investment',
    category: 'investment',
    rarity: 'common',
    icon: '🌱',
    points: 10,
    requirement: { type: 'transaction_count', value: 1 },
  },
  {
    id: 'diversified_portfolio',
    name: 'Diversification Master',
    description: 'Hold 10 different assets in your portfolio',
    category: 'investment',
    rarity: 'rare',
    icon: '🎯',
    points: 50,
    requirement: { type: 'unique_holdings', value: 10 },
  },
  {
    id: 'big_investor',
    name: 'Whale Status',
    description: 'Invest over $10,000 total',
    category: 'investment',
    rarity: 'epic',
    icon: '🐋',
    points: 100,
    requirement: { type: 'total_invested', value: 10000 },
  },
  {
    id: 'profit_master',
    name: 'Profit Prophet',
    description: 'Achieve 50% total returns',
    category: 'investment',
    rarity: 'legendary',
    icon: '💎',
    points: 200,
    requirement: { type: 'return_percentage', value: 50 },
  },
  
  // ESG Achievements
  {
    id: 'green_investor',
    name: 'Green Thumb',
    description: 'Maintain portfolio ESG score above 80',
    category: 'esg',
    rarity: 'common',
    icon: '🌿',
    points: 20,
    requirement: { type: 'esg_score', value: 80 },
  },
  {
    id: 'carbon_neutral',
    name: 'Carbon Neutral',
    description: 'Offset 1 ton of carbon through investments',
    category: 'esg',
    rarity: 'rare',
    icon: '🌍',
    points: 60,
    requirement: { type: 'carbon_offset', value: 1000 },
  },
  {
    id: 'impact_investor',
    name: 'Impact Champion',
    description: '100% of portfolio in ESG-rated assets',
    category: 'esg',
    rarity: 'epic',
    icon: '♻️',
    points: 100,
    requirement: { type: 'esg_portfolio_percentage', value: 100 },
  },
  
  // Streak Achievements
  {
    id: 'week_streak',
    name: 'Consistent Investor',
    description: 'Invest for 7 consecutive days',
    category: 'streak',
    rarity: 'common',
    icon: '📅',
    points: 15,
    requirement: { type: 'investment_streak', value: 7 },
  },
  {
    id: 'month_streak',
    name: 'Monthly Momentum',
    description: 'Invest for 30 consecutive days',
    category: 'streak',
    rarity: 'rare',
    icon: '📆',
    points: 50,
    requirement: { type: 'investment_streak', value: 30 },
  },
  {
    id: 'year_streak',
    name: 'Annual Achiever',
    description: 'Invest for 365 consecutive days',
    category: 'streak',
    rarity: 'legendary',
    icon: '🏆',
    points: 500,
    requirement: { type: 'investment_streak', value: 365 },
  },
  
  // Education Achievements
  {
    id: 'tutorial_complete',
    name: 'Quick Learner',
    description: 'Complete the investment tutorial',
    category: 'education',
    rarity: 'common',
    icon: '📚',
    points: 10,
    requirement: { type: 'tutorial_completed', value: 1 },
  },
  {
    id: 'market_researcher',
    name: 'Market Scholar',
    description: 'Read 10 market analysis articles',
    category: 'education',
    rarity: 'rare',
    icon: '🔍',
    points: 30,
    requirement: { type: 'articles_read', value: 10 },
  },
]

export class AchievementsService {
  static async getUserStats(userId: string): Promise<UserStats> {
    const supabase = await createClient()
    
    // Get portfolio stats
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('id, total_invested, total_returns, esg_score')
      .eq('user_id', userId)
    
    // Get transaction count
    const { count: transactionCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('portfolio_id', portfolios?.[0]?.id || '')
    
    // Get unique holdings count
    const { data: holdings } = await supabase
      .from('holdings')
      .select('asset_id')
      .eq('portfolio_id', portfolios?.[0]?.id || '')
    
    const uniqueHoldings = new Set(holdings?.map(h => h.asset_id)).size
    
    // Calculate totals
    const totalInvested = portfolios?.reduce((sum, p) => sum + (p.total_invested || 0), 0) || 0
    const totalReturns = portfolios?.reduce((sum, p) => sum + (p.total_returns || 0), 0) || 0
    const avgEsgScore = portfolios?.length 
      ? portfolios.reduce((sum, p) => sum + (p.esg_score || 0), 0) / portfolios.length 
      : 0
    
    // Get user level and points
    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('total_points, level, investment_streak')
      .eq('user_id', userId)
      .single()
    
    const totalPoints = userProgress?.total_points || 0
    const level = userProgress?.level || 1
    const investmentStreak = userProgress?.investment_streak || 0
    
    return {
      totalInvested,
      totalReturns,
      portfolioCount: portfolios?.length || 0,
      holdingsCount: uniqueHoldings,
      transactionCount: transactionCount || 0,
      esgAverageScore: Math.round(avgEsgScore),
      investmentStreak,
      totalPoints,
      level,
      nextLevelPoints: this.getPointsForLevel(level + 1),
    }
  }
  
  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    const supabase = await createClient()
    const stats = await this.getUserStats(userId)
    
    // Get unlocked achievements
    const { data: unlockedAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId)
    
    const unlockedIds = new Set(unlockedAchievements?.map(a => a.achievement_id) || [])
    
    // Map achievements with progress
    return ACHIEVEMENTS_CATALOG.map(achievement => {
      const isUnlocked = unlockedIds.has(achievement.id)
      const progress = this.calculateProgress(achievement, stats)
      
      return {
        ...achievement,
        unlockedAt: isUnlocked 
          ? unlockedAchievements?.find(a => a.achievement_id === achievement.id)?.unlocked_at 
          : undefined,
        progress,
        requirement: {
          ...achievement.requirement,
          current: progress * achievement.requirement.value,
        },
      }
    })
  }
  
  static async checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
    const supabase = await createClient()
    const achievements = await this.getUserAchievements(userId)
    const newlyUnlocked: Achievement[] = []
    
    for (const achievement of achievements) {
      const progress = achievement.progress || 0
      if (!achievement.unlockedAt && progress >= 1) {
        // Unlock achievement
        const { error } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
            unlocked_at: new Date().toISOString(),
          })
        
        if (!error) {
          // Update user points
          await supabase.rpc('add_user_points', {
            user_id: userId,
            points: achievement.points,
          })
          
          newlyUnlocked.push({
            ...achievement,
            unlockedAt: new Date().toISOString(),
          })
        }
      }
    }
    
    return newlyUnlocked
  }
  
  static async getLeaderboard(timeframe: 'all' | 'month' | 'week' = 'all'): Promise<LeaderboardEntry[]> {
    const supabase = await createClient()
    
    let query = supabase
      .from('user_progress')
      .select(`
        user_id,
        total_points,
        level,
        profiles!inner(
          full_name,
          avatar_url
        )
      `)
      .order('total_points', { ascending: false })
      .limit(100)
    
    if (timeframe === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      query = query.gte('updated_at', monthAgo.toISOString())
    } else if (timeframe === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.gte('updated_at', weekAgo.toISOString())
    }
    
    interface LeaderboardEntry {
      user_id: string
      total_points: number
      level: number
      profiles?: {
        full_name: string
        avatar_url: string
      }
    }
    
    const { data: leaderboard } = await query as { data: LeaderboardEntry[] | null }
    
    return (leaderboard || []).map((entry, index) => ({
      userId: entry.user_id,
      username: entry.profiles?.full_name || 'Anonymous',
      avatar: entry.profiles?.avatar_url,
      totalPoints: entry.total_points,
      level: entry.level,
      rank: index + 1,
    }))
  }
  
  private static calculateProgress(achievement: Achievement, stats: UserStats): number {
    switch (achievement.requirement.type) {
      case 'transaction_count':
        return Math.min(stats.transactionCount / achievement.requirement.value, 1)
      case 'unique_holdings':
        return Math.min(stats.holdingsCount / achievement.requirement.value, 1)
      case 'total_invested':
        return Math.min(stats.totalInvested / achievement.requirement.value, 1)
      case 'return_percentage':
        const returnPercentage = stats.totalInvested > 0 
          ? (stats.totalReturns / stats.totalInvested) * 100 
          : 0
        return Math.min(returnPercentage / achievement.requirement.value, 1)
      case 'esg_score':
        return Math.min(stats.esgAverageScore / achievement.requirement.value, 1)
      case 'investment_streak':
        return Math.min(stats.investmentStreak / achievement.requirement.value, 1)
      default:
        return 0
    }
  }
  
  private static getPointsForLevel(level: number): number {
    // Exponential growth: 100, 250, 500, 1000, 2000, etc.
    return Math.floor(100 * Math.pow(2, level - 1))
  }
  
  static async updateInvestmentStreak(userId: string): Promise<number> {
    const supabase = await createClient()
    
    // Check last investment date
    const { data: lastInvestment } = await supabase
      .from('transactions')
      .select('created_at')
      .eq('type', 'buy')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (!lastInvestment) return 0
    
    const lastDate = new Date(lastInvestment.created_at)
    const today = new Date()
    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 0 || daysDiff === 1) {
      // Continue or maintain streak
      const { data: progress } = await supabase
        .from('user_progress')
        .select('investment_streak')
        .eq('user_id', userId)
        .single()
      
      const newStreak = daysDiff === 0 ? (progress?.investment_streak || 0) : (progress?.investment_streak || 0) + 1
      
      await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          investment_streak: newStreak,
          last_investment_date: today.toISOString(),
        })
      
      return newStreak
    } else {
      // Reset streak
      await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          investment_streak: 1,
          last_investment_date: today.toISOString(),
        })
      
      return 1
    }
  }
}