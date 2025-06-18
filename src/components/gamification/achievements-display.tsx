'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Target, Flame, Star, Lock, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Achievement, AchievementCategory, UserStats } from '@/lib/gamification/achievements.service'
import { cn } from '@/lib/utils'

interface AchievementsDisplayProps {
  achievements: Achievement[]
  stats: UserStats
  onAchievementClick?: (achievement: Achievement) => void
}

const categoryIcons: Record<AchievementCategory, React.ReactNode> = {
  investment: <TrendingUp className="h-4 w-4" />,
  esg: <Star className="h-4 w-4" />,
  streak: <Flame className="h-4 w-4" />,
  education: <Target className="h-4 w-4" />,
  social: <Trophy className="h-4 w-4" />,
}

const rarityColors = {
  common: 'bg-gray-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-yellow-500',
}

function AchievementCard({ 
  achievement, 
  onClick 
}: { 
  achievement: Achievement
  onClick?: () => void 
}) {
  const isUnlocked = !!achievement.unlockedAt
  const progress = achievement.progress || 0
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={cn(
          "cursor-pointer transition-all",
          isUnlocked ? "border-primary" : "opacity-75"
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "text-2xl p-2 rounded-lg",
                isUnlocked ? "bg-primary/10" : "bg-muted"
              )}>
                {isUnlocked ? achievement.icon : <Lock className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div>
                <CardTitle className="text-base">{achievement.name}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {achievement.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge 
                variant="secondary" 
                className={cn(rarityColors[achievement.rarity], "text-white")}
              >
                {achievement.rarity}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {categoryIcons[achievement.category]}
                <span>{achievement.points} pts</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isUnlocked && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>
                  {achievement.requirement.current?.toFixed(0)} / {achievement.requirement.value}
                </span>
              </div>
              <Progress value={progress * 100} className="h-2" />
            </div>
          )}
          {isUnlocked && achievement.unlockedAt && (
            <div className="text-xs text-muted-foreground">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function AchievementsDisplay({ 
  achievements, 
  stats, 
  onAchievementClick 
}: AchievementsDisplayProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all')
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)
  
  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false
    }
    if (showUnlockedOnly && !achievement.unlockedAt) {
      return false
    }
    return true
  })
  
  const unlockedCount = achievements.filter(a => a.unlockedAt).length
  const totalPoints = achievements
    .filter(a => a.unlockedAt)
    .reduce((sum, a) => sum + a.points, 0)
  
  const levelProgress = ((stats.totalPoints % stats.nextLevelPoints) / stats.nextLevelPoints) * 100
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.level}</div>
            <Progress value={levelProgress} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalPoints} / {stats.nextLevelPoints} XP
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {unlockedCount} / {achievements.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((unlockedCount / achievements.length) * 100)}% complete
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.investmentStreak}</div>
            <p className="text-xs text-muted-foreground">
              Days investing
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Achievements List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Achievements</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
                className={cn(
                  "text-sm px-3 py-1 rounded-md transition-colors",
                  showUnlockedOnly 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                Unlocked Only
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as AchievementCategory | 'all')}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="investment">Investment</TabsTrigger>
              <TabsTrigger value="esg">ESG</TabsTrigger>
              <TabsTrigger value="streak">Streak</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedCategory} className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {filteredAchievements.map(achievement => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      onClick={() => onAchievementClick?.(achievement)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}