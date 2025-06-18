'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Medal, Award, Crown, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { LeaderboardEntry } from '@/lib/gamification/achievements.service'
import { cn } from '@/lib/utils'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  timeframe: 'all' | 'month' | 'week'
  onTimeframeChange: (timeframe: 'all' | 'month' | 'week') => void
}

const rankIcons = {
  1: <Crown className="h-5 w-5 text-yellow-500" />,
  2: <Medal className="h-5 w-5 text-gray-400" />,
  3: <Award className="h-5 w-5 text-orange-600" />,
}

const levelColors = [
  'bg-gray-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-red-500',
]

function LeaderboardRow({ 
  entry, 
  isCurrentUser,
  index 
}: { 
  entry: LeaderboardEntry
  isCurrentUser: boolean
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-center justify-between p-4 rounded-lg transition-colors",
        isCurrentUser ? "bg-primary/10 border border-primary" : "hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10">
          {rankIcons[entry.rank as keyof typeof rankIcons] || (
            <span className="text-lg font-bold text-muted-foreground">
              {entry.rank}
            </span>
          )}
        </div>
        
        <Avatar>
          <AvatarImage src={entry.avatar} />
          <AvatarFallback>
            {entry.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">
              {entry.username}
              {isCurrentUser && <span className="text-primary"> (You)</span>}
            </p>
            <Badge 
              variant="secondary" 
              className={cn(
                levelColors[(entry.level - 1) % levelColors.length],
                "text-white text-xs"
              )}
            >
              Lvl {entry.level}
            </Badge>
          </div>
          {entry.topAchievement && (
            <p className="text-xs text-muted-foreground mt-1">
              🏆 {entry.topAchievement}
            </p>
          )}
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-bold text-lg">{entry.totalPoints.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">points</p>
      </div>
    </motion.div>
  )
}

export function Leaderboard({ 
  entries, 
  currentUserId, 
  timeframe,
  onTimeframeChange 
}: LeaderboardProps) {
  const [showFullList, setShowFullList] = useState(false)
  
  const displayedEntries = showFullList ? entries : entries.slice(0, 10)
  const currentUserEntry = entries.find(e => e.userId === currentUserId)
  const currentUserInTop10 = currentUserEntry && currentUserEntry.rank <= 10
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Leaderboard
            </CardTitle>
            <CardDescription>
              Compete with other sustainable investors
            </CardDescription>
          </div>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={timeframe} onValueChange={(v) => onTimeframeChange(v as 'all' | 'month' | 'week')}>
          <TabsList className="w-full">
            <TabsTrigger value="week" className="flex-1">This Week</TabsTrigger>
            <TabsTrigger value="month" className="flex-1">This Month</TabsTrigger>
            <TabsTrigger value="all" className="flex-1">All Time</TabsTrigger>
          </TabsList>
          
          <TabsContent value={timeframe} className="mt-6">
            <div className="space-y-2">
              {displayedEntries.map((entry, index) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={entry.userId === currentUserId}
                  index={index}
                />
              ))}
              
              {!currentUserInTop10 && currentUserEntry && !showFullList && (
                <>
                  <div className="text-center py-2 text-muted-foreground">
                    • • •
                  </div>
                  <LeaderboardRow
                    entry={currentUserEntry}
                    isCurrentUser={true}
                    index={11}
                  />
                </>
              )}
            </div>
            
            {entries.length > 10 && (
              <button
                onClick={() => setShowFullList(!showFullList)}
                className="w-full mt-4 text-sm text-primary hover:underline"
              >
                {showFullList ? 'Show Less' : `Show All (${entries.length} users)`}
              </button>
            )}
            
            {entries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No data available for this timeframe
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}