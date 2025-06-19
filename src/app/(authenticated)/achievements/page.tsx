'use client'

import { useEffect, useState } from 'react'

import { redirect } from 'next/navigation'

import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { Trophy, Sparkles } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { AchievementsDisplay } from '@/components/gamification/achievements-display'
import { Leaderboard } from '@/components/gamification/leaderboard'
import { Card, CardContent } from '@/components/ui/card'
import { 
  type Achievement, 
  type UserStats, 
  type LeaderboardEntry
} from '@/lib/gamification/achievements.service'

// Mock data for development
const mockStats: UserStats = {
  totalInvested: 5000,
  totalReturns: 750,
  portfolioCount: 2,
  holdingsCount: 8,
  transactionCount: 25,
  esgAverageScore: 82,
  investmentStreak: 12,
  totalPoints: 450,
  level: 3,
  nextLevelPoints: 500,
}

const mockAchievements: Achievement[] = [
  {
    id: 'first_investment',
    name: 'First Steps',
    description: 'Make your first investment',
    category: 'investment',
    rarity: 'common',
    icon: '🌱',
    points: 10,
    requirement: { type: 'transaction_count', value: 1, current: 1 },
    unlockedAt: '2024-01-15',
    progress: 1,
  },
  {
    id: 'green_investor',
    name: 'Green Thumb',
    description: 'Maintain portfolio ESG score above 80',
    category: 'esg',
    rarity: 'common',
    icon: '🌿',
    points: 20,
    requirement: { type: 'esg_score', value: 80, current: 82 },
    unlockedAt: '2024-02-01',
    progress: 1,
  },
  {
    id: 'week_streak',
    name: 'Consistent Investor',
    description: 'Invest for 7 consecutive days',
    category: 'streak',
    rarity: 'common',
    icon: '📅',
    points: 15,
    requirement: { type: 'investment_streak', value: 7, current: 12 },
    unlockedAt: '2024-02-20',
    progress: 1,
  },
  {
    id: 'diversified_portfolio',
    name: 'Diversification Master',
    description: 'Hold 10 different assets in your portfolio',
    category: 'investment',
    rarity: 'rare',
    icon: '🎯',
    points: 50,
    requirement: { type: 'unique_holdings', value: 10, current: 8 },
    progress: 0.8,
  },
  {
    id: 'month_streak',
    name: 'Monthly Momentum',
    description: 'Invest for 30 consecutive days',
    category: 'streak',
    rarity: 'rare',
    icon: '📆',
    points: 50,
    requirement: { type: 'investment_streak', value: 30, current: 12 },
    progress: 0.4,
  },
  {
    id: 'big_investor',
    name: 'Whale Status',
    description: 'Invest over $10,000 total',
    category: 'investment',
    rarity: 'epic',
    icon: '🐋',
    points: 100,
    requirement: { type: 'total_invested', value: 10000, current: 5000 },
    progress: 0.5,
  },
]

const mockLeaderboard: LeaderboardEntry[] = [
  { userId: '1', username: 'EcoInvestor', totalPoints: 2450, level: 8, rank: 1, topAchievement: 'Carbon Neutral' },
  { userId: '2', username: 'GreenThumb22', totalPoints: 2120, level: 7, rank: 2, topAchievement: 'Impact Champion' },
  { userId: '3', username: 'SustainableWealth', totalPoints: 1890, level: 6, rank: 3, topAchievement: 'Profit Prophet' },
  { userId: '4', username: 'TreeHugger', totalPoints: 1650, level: 6, rank: 4 },
  { userId: '5', username: 'CleanEnergy', totalPoints: 1420, level: 5, rank: 5 },
  { userId: 'current', username: 'You', totalPoints: 450, level: 3, rank: 28 },
]

export default function AchievementsPage() {
  const { status } = useSession()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<'all' | 'month' | 'week'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    async function fetchAchievements() {
      // In production, fetch from API
      // For now, use mock data
      setAchievements(mockAchievements)
      setStats(mockStats)
      setLeaderboard(mockLeaderboard)
      setIsLoading(false)
      
      // Check for newly unlocked achievements
      const newlyUnlocked = mockAchievements.filter(
        a => a.unlockedAt && new Date(a.unlockedAt) > new Date(Date.now() - 5000)
      )
      
      if (newlyUnlocked.length > 0) {
        showAchievementNotification(newlyUnlocked[0])
      }
    }

    if (status === 'authenticated') {
      fetchAchievements()
    }
  }, [status])

  const showAchievementNotification = (achievement: Achievement) => {
    // Show toast
    toast.success(
      <div className="flex items-center gap-3">
        <span className="text-2xl">{achievement.icon}</span>
        <div>
          <p className="font-semibold">Achievement Unlocked!</p>
          <p className="text-sm">{achievement.name}</p>
        </div>
      </div>,
      { duration: 5000 }
    )
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
    })
  }

  const handleAchievementClick = (achievement: Achievement) => {
    const progress = achievement.progress || 0
    if (!achievement.unlockedAt && progress >= 0.9) {
      toast.info(`You're close! ${((1 - progress) * 100).toFixed(0)}% left to unlock ${achievement.name}`)
    }
  }

  if (status === 'loading' || isLoading) {
    return <AchievementsPageSkeleton />
  }

  if (!stats) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          Achievements & Rewards
          <Sparkles className="h-6 w-6 text-yellow-500" />
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your progress and compete with other sustainable investors
        </p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AchievementsDisplay
            achievements={achievements}
            stats={stats}
            onAchievementClick={handleAchievementClick}
          />
        </div>
        
        <div>
          <Leaderboard
            entries={leaderboard}
            currentUserId="current"
            timeframe={leaderboardTimeframe}
            onTimeframeChange={setLeaderboardTimeframe}
          />
        </div>
      </div>
    </div>
  )
}

function AchievementsPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-5 w-96 bg-muted rounded mt-2 animate-pulse" />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="h-32 animate-pulse" />
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="h-96 animate-pulse" />
        </Card>
      </div>
    </div>
  )
}