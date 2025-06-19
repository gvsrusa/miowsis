'use client'

import { useState, useEffect } from 'react'

import { redirect } from 'next/navigation'

import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Leaf,
  Star,
  ChevronRight,
  BarChart3,
  Info
} from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface Investment {
  id: string
  symbol: string
  name: string
  type: 'stock' | 'etf' | 'bond' | 'fund'
  price: number
  change24h: number
  changePercentage24h: number
  marketCap: number
  volume24h: number
  esgScore: number
  environmentScore: number
  socialScore: number
  governanceScore: number
  sector: string
  description: string
  trending: boolean
}

// Mock data for demonstration
const mockInvestments: Investment[] = [
  {
    id: '1',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    type: 'stock',
    price: 246.38,
    change24h: 4.32,
    changePercentage24h: 1.78,
    marketCap: 782.3e9,
    volume24h: 28.4e9,
    esgScore: 82,
    environmentScore: 90,
    socialScore: 75,
    governanceScore: 81,
    sector: 'Technology',
    description: 'Electric vehicle and clean energy company',
    trending: true,
  },
  {
    id: '2',
    symbol: 'ICLN',
    name: 'iShares Global Clean Energy ETF',
    type: 'etf',
    price: 18.42,
    change24h: -0.12,
    changePercentage24h: -0.65,
    marketCap: 5.2e9,
    volume24h: 142.3e6,
    esgScore: 91,
    environmentScore: 95,
    socialScore: 88,
    governanceScore: 90,
    sector: 'Clean Energy',
    description: 'ETF tracking global clean energy companies',
    trending: true,
  },
  {
    id: '3',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    type: 'stock',
    price: 429.87,
    change24h: 2.15,
    changePercentage24h: 0.50,
    marketCap: 3.2e12,
    volume24h: 22.1e9,
    esgScore: 85,
    environmentScore: 87,
    socialScore: 83,
    governanceScore: 85,
    sector: 'Technology',
    description: 'Software and cloud computing giant',
    trending: false,
  },
  {
    id: '4',
    symbol: 'GRNB',
    name: 'Green Bond ETF',
    type: 'bond',
    price: 52.34,
    change24h: 0.08,
    changePercentage24h: 0.15,
    marketCap: 1.8e9,
    volume24h: 45.2e6,
    esgScore: 94,
    environmentScore: 98,
    socialScore: 92,
    governanceScore: 92,
    sector: 'Fixed Income',
    description: 'Bonds funding environmental projects',
    trending: false,
  },
  {
    id: '5',
    symbol: 'VSGX',
    name: 'Vanguard ESG International Stock ETF',
    type: 'etf',
    price: 58.92,
    change24h: 0.34,
    changePercentage24h: 0.58,
    marketCap: 7.3e9,
    volume24h: 89.4e6,
    esgScore: 88,
    environmentScore: 86,
    socialScore: 89,
    governanceScore: 89,
    sector: 'International Equity',
    description: 'International stocks with high ESG ratings',
    trending: false,
  },
]

export default function MarketPage() {
  const { status } = useSession()
  const [investments, setInvestments] = useState<Investment[]>([])
  const [filteredInvestments, setFilteredInvestments] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('esg')
  const [filterType, setFilterType] = useState('all')
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setInvestments(mockInvestments)
      setFilteredInvestments(mockInvestments)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let filtered = [...investments]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(inv => 
        inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(inv => inv.type === filterType)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'esg':
          return b.esgScore - a.esgScore
        case 'price':
          return b.price - a.price
        case 'change':
          return b.changePercentage24h - a.changePercentage24h
        case 'volume':
          return b.volume24h - a.volume24h
        default:
          return 0
      }
    })

    setFilteredInvestments(filtered)
  }, [investments, searchQuery, sortBy, filterType])

  if (status === 'loading' || isLoading) {
    return <MarketSkeleton />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Investment Market</h1>
        <p className="text-muted-foreground mt-2">
          Discover sustainable investment opportunities
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search investments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="stock">Stocks</SelectItem>
            <SelectItem value="etf">ETFs</SelectItem>
            <SelectItem value="bond">Bonds</SelectItem>
            <SelectItem value="fund">Funds</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <BarChart3 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="esg">ESG Score</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="change">24h Change</SelectItem>
            <SelectItem value="volume">Volume</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="sustainable">Top ESG</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <InvestmentGrid investments={filteredInvestments} onSelect={setSelectedInvestment} />
        </TabsContent>
        <TabsContent value="trending">
          <InvestmentGrid 
            investments={filteredInvestments.filter(inv => inv.trending)} 
            onSelect={setSelectedInvestment}
          />
        </TabsContent>
        <TabsContent value="sustainable">
          <InvestmentGrid 
            investments={filteredInvestments.filter(inv => inv.esgScore >= 85)} 
            onSelect={setSelectedInvestment}
          />
        </TabsContent>
      </Tabs>

      {/* Investment Detail Sheet */}
      <Sheet open={!!selectedInvestment} onOpenChange={(open) => !open && setSelectedInvestment(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedInvestment && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedInvestment.name}</SheetTitle>
                <SheetDescription>
                  {selectedInvestment.symbol} • {selectedInvestment.sector}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-3xl font-bold">
                    ${selectedInvestment.price.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-sm font-medium",
                      selectedInvestment.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {selectedInvestment.change24h >= 0 ? '+' : ''}{selectedInvestment.change24h.toFixed(2)}
                    </span>
                    <span className={cn(
                      "text-sm",
                      selectedInvestment.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      ({selectedInvestment.changePercentage24h.toFixed(2)}%)
                    </span>
                    {selectedInvestment.change24h >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">ESG Scores</h4>
                  <div className="space-y-3">
                    <ESGScoreBar 
                      label="Overall ESG" 
                      score={selectedInvestment.esgScore} 
                      color="green"
                    />
                    <ESGScoreBar 
                      label="Environment" 
                      score={selectedInvestment.environmentScore} 
                      color="emerald"
                    />
                    <ESGScoreBar 
                      label="Social" 
                      score={selectedInvestment.socialScore} 
                      color="blue"
                    />
                    <ESGScoreBar 
                      label="Governance" 
                      score={selectedInvestment.governanceScore} 
                      color="purple"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Market Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Market Cap</span>
                      <span className="text-sm font-medium">
                        ${(selectedInvestment.marketCap / 1e9).toFixed(1)}B
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">24h Volume</span>
                      <span className="text-sm font-medium">
                        ${(selectedInvestment.volume24h / 1e6).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {selectedInvestment.description}
                </p>

                <div className="pt-4 space-y-2">
                  <Button className="w-full">
                    Add to Portfolio
                  </Button>
                  <Button variant="outline" className="w-full">
                    Add to Watchlist
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function InvestmentGrid({ 
  investments, 
  onSelect 
}: { 
  investments: Investment[]
  onSelect: (investment: Investment) => void 
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {investments.map((investment, index) => (
        <motion.div
          key={investment.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelect(investment)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {investment.symbol}
                    {investment.trending && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    {investment.name}
                  </CardDescription>
                </div>
                <Badge variant="outline">{investment.type.toUpperCase()}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">
                    ${investment.price.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={cn(
                      "text-sm",
                      investment.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {investment.change24h >= 0 ? '+' : ''}{investment.changePercentage24h.toFixed(2)}%
                    </span>
                    {investment.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {investment.esgScore}/100
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4 mr-1" />
                    Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

function ESGScoreBar({ 
  label, 
  score, 
  color 
}: { 
  label: string
  score: number
  color: string 
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-medium">{score}/100</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500",
            color === 'green' && 'bg-green-600',
            color === 'emerald' && 'bg-emerald-600',
            color === 'blue' && 'bg-blue-600',
            color === 'purple' && 'bg-purple-600'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function MarketSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  )
}