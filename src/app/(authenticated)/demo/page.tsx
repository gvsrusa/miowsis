'use client'

import { 
  InvestmentCard, 
  PortfolioSummaryCard, 
  StatCard, 
  ESGScoreDisplay, 
  ChartPlaceholder 
} from '@/components/investment'
import { DollarSign, TrendingUp, Users, BarChart3 } from 'lucide-react'

export default function DemoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Component Demo</h1>
        <p className="text-muted-foreground mt-2">
          Showcase of all new investment UI components
        </p>
      </div>

      <div className="space-y-8">
        {/* Stat Cards */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Stat Cards</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Value"
              value="$125,430"
              description="All portfolios combined"
              icon={<DollarSign className="h-4 w-4" />}
              trend={{ value: 12.5, isPositive: true }}
            />
            <StatCard
              title="Monthly Returns"
              value="+$2,340"
              description="This month performance"
              icon={<TrendingUp className="h-4 w-4" />}
              trend={{ value: 8.3, isPositive: true }}
            />
            <StatCard
              title="Active Investments"
              value="24"
              description="Across 3 portfolios"
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <StatCard
              title="ESG Average"
              value="85/100"
              description="Portfolio sustainability"
              icon={<Users className="h-4 w-4" />}
              trend={{ value: 3.2, isPositive: true }}
            />
          </div>
        </section>

        {/* Investment Cards */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Investment Cards</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InvestmentCard
              symbol="TSLA"
              name="Tesla Inc."
              type="stock"
              price={246.38}
              change={4.32}
              changePercentage={1.78}
              esgScore={82}
              onDetailsClick={() => console.log('Details clicked')}
            />
            <InvestmentCard
              symbol="ICLN"
              name="iShares Global Clean Energy ETF"
              type="etf"
              price={18.42}
              change={-0.12}
              changePercentage={-0.65}
              esgScore={91}
              onDetailsClick={() => console.log('Details clicked')}
            />
            <InvestmentCard
              symbol="GRNB"
              name="Green Bond ETF"
              type="bond"
              price={52.34}
              change={0.08}
              changePercentage={0.15}
              esgScore={94}
              onDetailsClick={() => console.log('Details clicked')}
            />
          </div>
        </section>

        {/* Portfolio Summary Cards */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Portfolio Summary Cards</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <PortfolioSummaryCard
              name="ESG Growth Portfolio"
              totalValue={45000}
              totalInvested={40000}
              totalReturns={5000}
              returnsPercentage={12.5}
              esgScore={88}
              holdings={12}
              isActive={true}
            />
            <PortfolioSummaryCard
              name="Tech Sustainability"
              totalValue={30000}
              totalInvested={32000}
              totalReturns={-2000}
              returnsPercentage={-6.25}
              esgScore={79}
              holdings={8}
            />
            <PortfolioSummaryCard
              name="Green Energy Focus"
              totalValue={50430}
              totalInvested={45000}
              totalReturns={5430}
              returnsPercentage={12.07}
              esgScore={92}
              holdings={15}
            />
          </div>
        </section>

        {/* ESG Score Display */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">ESG Score Display</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <ESGScoreDisplay
              overallScore={85}
              environmentScore={88}
              socialScore={82}
              governanceScore={85}
              showDetails={true}
            />
            <ESGScoreDisplay
              overallScore={72}
              environmentScore={75}
              socialScore={68}
              governanceScore={73}
              showDetails={true}
            />
          </div>
        </section>

        {/* Chart Placeholders */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Chart Placeholders</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <ChartPlaceholder
              title="Portfolio Performance"
              description="Track your returns over time"
              type="line"
            />
            <ChartPlaceholder
              title="Asset Allocation"
              description="Your investment distribution"
              type="pie"
            />
            <ChartPlaceholder
              title="Monthly Returns"
              description="Month-by-month performance"
              type="bar"
            />
            <ChartPlaceholder
              title="ESG Score Trend"
              description="Sustainability metrics over time"
              type="area"
            />
          </div>
        </section>
      </div>
    </div>
  )
}