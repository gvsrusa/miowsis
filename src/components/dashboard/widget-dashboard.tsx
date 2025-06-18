'use client'

import { useState, useMemo } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, ArrowDownRight, Leaf, Plus, Send, CreditCard, Target, Settings2, X } from 'lucide-react'
import { AIAssistant } from '@/components/ai/ai-assistant'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

export interface WidgetData {
  portfolio?: {
    total_value: number
    total_invested: number
    total_returns: number
    esg_score: number
  }
  profile?: {
    full_name: string
  }
}

interface WidgetConfig {
  i: string
  type: string
  title: string
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

const availableWidgets: WidgetConfig[] = [
  { i: 'portfolio-overview', type: 'portfolio-overview', title: 'Portfolio Overview', minW: 2, minH: 2 },
  { i: 'esg-impact', type: 'esg-impact', title: 'ESG Impact', minW: 1, minH: 2 },
  { i: 'quick-actions', type: 'quick-actions', title: 'Quick Actions', minW: 1, minH: 2 },
  { i: 'recent-activity', type: 'recent-activity', title: 'Recent Activity', minW: 2, minH: 2 },
  { i: 'market-news', type: 'market-news', title: 'Market News', minW: 2, minH: 2 },
  { i: 'investment-goals', type: 'investment-goals', title: 'Investment Goals', minW: 2, minH: 2 },
  { i: 'ai-assistant', type: 'ai-assistant', title: 'AI Assistant', minW: 3, minH: 4 },
]

const defaultLayouts = {
  lg: [
    { i: 'portfolio-overview', x: 0, y: 0, w: 6, h: 4 },
    { i: 'esg-impact', x: 6, y: 0, w: 3, h: 4 },
    { i: 'quick-actions', x: 9, y: 0, w: 3, h: 4 },
    { i: 'recent-activity', x: 0, y: 4, w: 12, h: 3 },
  ],
  md: [
    { i: 'portfolio-overview', x: 0, y: 0, w: 6, h: 4 },
    { i: 'esg-impact', x: 6, y: 0, w: 3, h: 4 },
    { i: 'quick-actions', x: 0, y: 4, w: 3, h: 4 },
    { i: 'recent-activity', x: 3, y: 4, w: 6, h: 3 },
  ],
  sm: [
    { i: 'portfolio-overview', x: 0, y: 0, w: 6, h: 4 },
    { i: 'esg-impact', x: 0, y: 4, w: 6, h: 4 },
    { i: 'quick-actions', x: 0, y: 8, w: 6, h: 4 },
    { i: 'recent-activity', x: 0, y: 12, w: 6, h: 3 },
  ],
}

interface WidgetDashboardProps {
  data: WidgetData
}

export function WidgetDashboard({ data }: WidgetDashboardProps) {
  const [layouts, setLayouts] = useState(defaultLayouts)
  const [editMode, setEditMode] = useState(false)
  const [activeWidgets, setActiveWidgets] = useState(['portfolio-overview', 'esg-impact', 'quick-actions', 'recent-activity'])

  const availableToAdd = useMemo(
    () => availableWidgets.filter(w => !activeWidgets.includes(w.i)),
    [activeWidgets]
  )

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Record<string, Layout[]>) => {
    setLayouts(allLayouts as typeof defaultLayouts)
    // Save to localStorage or database
    localStorage.setItem('dashboard-layouts', JSON.stringify(allLayouts))
  }

  const addWidget = (widgetId: string) => {
    setActiveWidgets([...activeWidgets, widgetId])
    // Add to all breakpoint layouts
    const newLayouts = { ...layouts }
    Object.keys(newLayouts).forEach(breakpoint => {
      const widget = availableWidgets.find(w => w.i === widgetId)
      if (widget) {
        newLayouts[breakpoint as keyof typeof newLayouts].push({
          i: widgetId,
          x: 0,
          y: Infinity, // puts it at the bottom
          w: widget.minW || 2,
          h: widget.minH || 2,
        })
      }
    })
    setLayouts(newLayouts)
  }

  const removeWidget = (widgetId: string) => {
    setActiveWidgets(activeWidgets.filter(id => id !== widgetId))
    const newLayouts = { ...layouts }
    Object.keys(newLayouts).forEach(breakpoint => {
      newLayouts[breakpoint as keyof typeof newLayouts] = newLayouts[breakpoint as keyof typeof newLayouts].filter(
        item => item.i !== widgetId
      )
    })
    setLayouts(newLayouts)
  }

  const renderWidget = (widgetId: string) => {
    const widget = availableWidgets.find(w => w.i === widgetId)
    if (!widget) return null

    const content = (
      <Card className="h-full">
        {editMode && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 h-6 w-6"
            onClick={() => removeWidget(widgetId)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {renderWidgetContent(widget.type, data)}
      </Card>
    )

    return (
      <div key={widgetId}>
        {content}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {data.profile?.full_name || 'Investor'}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here&apos;s your investment overview for today
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setEditMode(!editMode)}
        >
          <Settings2 className="mr-2 h-4 w-4" />
          {editMode ? 'Done' : 'Customize'}
        </Button>
      </div>

      {editMode && availableToAdd.length > 0 && (
        <Card className="mb-4 p-4">
          <h3 className="font-semibold mb-2">Add Widgets</h3>
          <div className="flex flex-wrap gap-2">
            {availableToAdd.map(widget => (
              <Button
                key={widget.i}
                variant="outline"
                size="sm"
                onClick={() => addWidget(widget.i)}
              >
                <Plus className="mr-1 h-3 w-3" />
                {widget.title}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 9, sm: 6 }}
        rowHeight={60}
        isDraggable={editMode}
        isResizable={editMode}
        containerPadding={[0, 0]}
        margin={[16, 16]}
      >
        {activeWidgets.map(widgetId => renderWidget(widgetId))}
      </ResponsiveGridLayout>
    </div>
  )
}

function renderWidgetContent(type: string, data: WidgetData) {
  switch (type) {
    case 'portfolio-overview':
      return <PortfolioOverviewWidget data={data} />
    case 'esg-impact':
      return <ESGImpactWidget data={data} />
    case 'quick-actions':
      return <QuickActionsWidget />
    case 'recent-activity':
      return <RecentActivityWidget />
    case 'market-news':
      return <MarketNewsWidget />
    case 'investment-goals':
      return <InvestmentGoalsWidget />
    case 'ai-assistant':
      return <AIAssistant />
    default:
      return null
  }
}

function PortfolioOverviewWidget({ data }: { data: WidgetData }) {
  const portfolio = data.portfolio
  const returnsPercentage = portfolio?.total_invested 
    ? ((portfolio.total_returns / portfolio.total_invested) * 100).toFixed(2)
    : '0.00'
  const isPositiveReturn = portfolio?.total_returns ? portfolio.total_returns >= 0 : true

  return (
    <>
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
        <CardDescription>Your total investment performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-3xl font-bold">
              ${portfolio?.total_value?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Invested</p>
              <p className="text-xl font-semibold">
                ${portfolio?.total_invested?.toLocaleString() || '0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Returns</p>
              <div className="flex items-center gap-1">
                <p className={`text-xl font-semibold ${isPositiveReturn ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(portfolio?.total_returns || 0).toLocaleString()}
                </p>
                {isPositiveReturn ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${isPositiveReturn ? 'text-green-600' : 'text-red-600'}`}>
                  {returnsPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  )
}

function ESGImpactWidget({ data }: { data: WidgetData }) {
  const portfolio = data.portfolio

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-600" />
          ESG Impact
        </CardTitle>
        <CardDescription>Your sustainability score</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-green-600">
                {portfolio?.esg_score || 0}
              </p>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Excellent sustainability rating
            </p>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-500"
              style={{ width: `${portfolio?.esg_score || 0}%` }}
            />
          </div>
        </div>
      </CardContent>
    </>
  )
}

function QuickActionsWidget() {
  return (
    <>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button className="w-full justify-start" variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Funds
          </Button>
          <Button className="w-full justify-start" variant="outline" size="sm">
            <Send className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
          <Button className="w-full justify-start" variant="outline" size="sm">
            <CreditCard className="mr-2 h-4 w-4" />
            Link Bank
          </Button>
          <Button className="w-full justify-start" variant="outline" size="sm">
            <Target className="mr-2 h-4 w-4" />
            Set Goals
          </Button>
        </div>
      </CardContent>
    </>
  )
}

function RecentActivityWidget() {
  return (
    <>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest transactions and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">No recent activity to display</p>
        </div>
      </CardContent>
    </>
  )
}

function MarketNewsWidget() {
  return (
    <>
      <CardHeader>
        <CardTitle>Market News</CardTitle>
        <CardDescription>Latest financial updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Loading market news...</p>
        </div>
      </CardContent>
    </>
  )
}

function InvestmentGoalsWidget() {
  return (
    <>
      <CardHeader>
        <CardTitle>Investment Goals</CardTitle>
        <CardDescription>Track your progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">No goals set yet</p>
        </div>
      </CardContent>
    </>
  )
}