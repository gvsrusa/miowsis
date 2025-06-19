'use client'

import { useState } from 'react'

import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { TrendingUp, TrendingDown, MoreVertical } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SwipeablePortfolioCardProps {
  portfolio: {
    id: string
    name: string
    total_value: number
    total_returns: number
    esg_score: number
    holdings_count: number
  }
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onTap?: () => void
}

export function SwipeablePortfolioCard({
  portfolio,
  onSwipeLeft,
  onSwipeRight,
  onTap,
}: SwipeablePortfolioCardProps) {
  const [exitX, setExitX] = useState(0)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  
  const isPositiveReturn = portfolio.total_returns >= 0

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      setExitX(info.offset.x > 0 ? 200 : -200)
      if (info.offset.x > 0) {
        onSwipeRight?.()
      } else {
        onSwipeLeft?.()
      }
    }
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      whileTap={{ scale: 0.95 }}
      onClick={onTap}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <Card className="h-full touch-none select-none">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{portfolio.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {portfolio.holdings_count} holdings
              </p>
            </div>
            <button className="p-2 -m-2">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-3xl font-bold">
                ${portfolio.total_value.toLocaleString()}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Returns</p>
                <div className="flex items-center gap-1">
                  <p className={cn(
                    "text-lg font-semibold",
                    isPositiveReturn ? "text-green-600" : "text-red-600"
                  )}>
                    ${Math.abs(portfolio.total_returns).toLocaleString()}
                  </p>
                  {isPositiveReturn ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">ESG Score</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-lg font-semibold text-green-600">
                    {portfolio.esg_score}
                  </p>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
            </div>
            
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                style={{ width: `${portfolio.esg_score}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Swipe indicators */}
      <motion.div
        className="absolute inset-y-0 left-4 flex items-center"
        style={{
          opacity: useTransform(x, [-100, 0], [1, 0]),
        }}
      >
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
          Details
        </div>
      </motion.div>
      
      <motion.div
        className="absolute inset-y-0 right-4 flex items-center"
        style={{
          opacity: useTransform(x, [0, 100], [0, 1]),
        }}
      >
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold">
          Trade
        </div>
      </motion.div>
    </motion.div>
  )
}