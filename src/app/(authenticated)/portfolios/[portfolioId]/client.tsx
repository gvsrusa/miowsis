'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ArrowLeft, TrendingUp, TrendingDown, Activity, DollarSign, Leaf, RefreshCw } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

import { Portfolio3DVisualization } from '@/components/portfolio/portfolio-3d-visualization'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'



interface PortfolioDetails {
  id: string
  name: string
  currency: string
  total_value: number
  total_invested: number
  total_returns: number
  esg_score: number
  carbon_offset: number
  is_active: boolean
  holdings: Array<{
    id: string
    quantity: number
    average_cost: number
    total_invested: number
    asset: {
      id: string
      symbol: string
      name: string
      current_price: number
      asset_type: string
    }
  }>
  transactions: Array<{
    id: string
    type: string
    quantity: number
    price: number
    total_amount: number
    created_at: string
    asset: {
      symbol: string
      name: string
    }
  }>
}

export default function PortfolioDetailPage({ 
  params 
}: { 
  params: { portfolioId: string } 
}) {
  const { data: session, status } = useSession()
  const [portfolio, setPortfolio] = useState<PortfolioDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    async function fetchPortfolio() {
      if (!session) return

      try {
        const response = await fetch(`/api/portfolios/${params.portfolioId}`)
        if (!response.ok) throw new Error('Failed to fetch portfolio')
        
        const data = await response.json()
        setPortfolio(data.portfolio)
      } catch (error) {
        console.error('Error fetching portfolio:', error)
        toast.error('Failed to load portfolio')
        redirect('/portfolios')
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchPortfolio()
    }
  }, [session, status, params.portfolioId])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    try {
      const response = await fetch(`/api/portfolios/${params.portfolioId}/refresh`, {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error('Failed to refresh portfolio')
      
      const data = await response.json()
      setPortfolio(data.portfolio)
      toast.success('Portfolio data refreshed')
    } catch (error) {
      console.error('Error refreshing portfolio:', error)
      toast.error('Failed to refresh portfolio')
    } finally {
      setIsRefreshing(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return <PortfolioDetailSkeleton />
  }

  if (!portfolio) {
    return null
  }

  const returnsPercentage = portfolio.total_invested > 0 
    ? ((portfolio.total_returns / portfolio.total_invested) * 100).toFixed(2)
    : '0.00'
  const isPositiveReturn = portfolio.total_returns >= 0

  // Transform holdings for 3D visualization
  const holdingsWithValue = portfolio.holdings.map(holding => ({
    asset_id: holding.asset.id,
    symbol: holding.asset.symbol,
    name: holding.asset.name,
    quantity: holding.quantity,
    current_value: holding.quantity * holding.asset.current_price,
    esg_score: Math.floor(Math.random() * 40) + 60, // Mock ESG score
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/portfolios">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{portfolio.name}</h1>
          <p className="text-muted-foreground mt-1">
            {portfolio.holdings.length} holdings · {portfolio.currency}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolio.total_value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Portfolio current value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            {isPositiveReturn ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isPositiveReturn ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(portfolio.total_returns).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {returnsPercentage}% return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ESG Score</CardTitle>
            <Leaf className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {portfolio.esg_score}/100
            </div>
            <p className="text-xs text-muted-foreground">
              Sustainability rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Holdings</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolio.holdings.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Visualization and Details */}
      <Tabs defaultValue="visualization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visualization">3D Visualization</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="visualization" className="space-y-4">
          <Portfolio3DVisualization 
            holdings={holdingsWithValue}
            totalValue={portfolio.total_value}
          />
        </TabsContent>

        <TabsContent value="holdings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Holdings</CardTitle>
              <CardDescription>Your current investment positions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolio.holdings.map(holding => {
                  const currentValue = holding.quantity * holding.asset.current_price
                  const gain = currentValue - holding.total_invested
                  const gainPercentage = (gain / holding.total_invested) * 100
                  
                  return (
                    <div key={holding.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">{holding.asset.symbol}</div>
                        <div className="text-sm text-muted-foreground">{holding.asset.name}</div>
                        <div className="text-sm mt-1">
                          {holding.quantity.toLocaleString()} shares @ ${holding.average_cost.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${currentValue.toLocaleString()}</div>
                        <div className={`text-sm ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {gain >= 0 ? '+' : ''}{gain.toFixed(2)} ({gainPercentage.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your trading history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolio.transactions.slice(0, 10).map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">
                        {transaction.type.toUpperCase()} {transaction.asset.symbol}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.quantity} shares @ ${transaction.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${transaction.total_amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Analytics</CardTitle>
              <CardDescription>Performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Advanced analytics coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PortfolioDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-32 mt-1" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}