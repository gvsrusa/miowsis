'use client'

import { useState } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, 
  TrendingUp, 
  Leaf, 
  Activity,
  Plus,
  Bot,
  Trophy,
  Briefcase,
  Home
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { SwipeablePortfolioCard } from './swipeable-portfolio-card'

interface MobileDashboardProps {
  data: {
    portfolio?: {
      total_value: number
      total_invested: number
      total_returns: number
      esg_score: number
    }
    portfolios?: Array<{
      id: string
      name: string
      total_value: number
      total_returns: number
      esg_score: number
      holdings_count: number
    }>
  }
}

const bottomNavItems = [
  { icon: Home, label: 'Home', value: 'home' },
  { icon: Briefcase, label: 'Portfolio', value: 'portfolio' },
  { icon: Plus, label: 'Invest', value: 'invest' },
  { icon: Trophy, label: 'Rewards', value: 'rewards' },
  { icon: Bot, label: 'AI', value: 'ai' },
]

export function MobileDashboard({ data }: MobileDashboardProps) {
  const [activeTab, setActiveTab] = useState('home')
  const [currentPortfolioIndex, setCurrentPortfolioIndex] = useState(0)
  
  const {portfolio} = data
  const portfolios = data.portfolios || []
  const isPositiveReturn = portfolio?.total_returns ? portfolio.total_returns >= 0 : true

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Stats Bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-lg font-bold">
                    ${portfolio?.total_value?.toLocaleString() || '0'}
                  </p>
                </div>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Returns</p>
                  <p className={cn(
                    "text-lg font-bold",
                    isPositiveReturn ? "text-green-600" : "text-red-600"
                  )}>
                    ${Math.abs(portfolio?.total_returns || 0).toLocaleString()}
                  </p>
                </div>
                {isPositiveReturn ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" className="h-auto flex-col py-3">
                    <Plus className="h-5 w-5 mb-1" />
                    <span className="text-xs">Add Funds</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto flex-col py-3">
                    <Activity className="h-5 w-5 mb-1" />
                    <span className="text-xs">Auto-Invest</span>
                  </Button>
                </CardContent>
              </Card>

              {/* ESG Impact */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">ESG Impact</CardTitle>
                  <Leaf className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-2xl font-bold text-green-600">
                          {portfolio?.esg_score || 0}
                        </span>
                        <span className="text-sm text-muted-foreground">/100</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600 transition-all duration-500"
                          style={{ width: `${portfolio?.esg_score || 0}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your investments are making a positive impact!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Bought ICLN</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">$500</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'portfolio' && portfolios.length > 0 && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative h-[500px]"
            >
              <h2 className="text-lg font-semibold mb-4">Your Portfolios</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Swipe to navigate • Tap for details
              </p>
              
              <div className="relative h-[400px]">
                {portfolios.map((portfolio, index) => (
                  <div
                    key={portfolio.id}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-300",
                      index === currentPortfolioIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                    )}
                  >
                    <SwipeablePortfolioCard
                      portfolio={portfolio}
                      onSwipeLeft={() => {
                        if (currentPortfolioIndex < portfolios.length - 1) {
                          setCurrentPortfolioIndex(currentPortfolioIndex + 1)
                        }
                      }}
                      onSwipeRight={() => {
                        if (currentPortfolioIndex > 0) {
                          setCurrentPortfolioIndex(currentPortfolioIndex - 1)
                        }
                      }}
                      onTap={() => {
                        window.location.href = `/portfolios/${portfolio.id}`
                      }}
                    />
                  </div>
                ))}
              </div>
              
              {/* Portfolio indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {portfolios.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index === currentPortfolioIndex ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="grid grid-cols-5">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 transition-colors",
                  activeTab === item.value
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}