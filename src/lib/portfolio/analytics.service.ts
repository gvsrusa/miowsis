import { createClient } from '@/lib/supabase/server'

export interface PortfolioAnalytics {
  portfolioId: string
  performance: PerformanceMetrics
  allocation: AllocationAnalysis
  risk: RiskMetrics
  diversification: DiversificationScore
  esg: ESGAnalysis
  projections: ProjectionData
}

export interface PerformanceMetrics {
  totalReturn: number
  totalReturnPercentage: number
  annualizedReturn: number
  dailyReturn: number
  weeklyReturn: number
  monthlyReturn: number
  yearToDateReturn: number
  allTimeHigh: number
  allTimeLow: number
  sharpeRatio: number
  volatility: number
  alpha: number
  beta: number
  maxDrawdown: number
  winRate: number
}

export interface AllocationAnalysis {
  byAssetType: Array<{
    type: string
    value: number
    percentage: number
    count: number
  }>
  bySector: Array<{
    sector: string
    value: number
    percentage: number
    count: number
  }>
  byRegion: Array<{
    region: string
    value: number
    percentage: number
  }>
  topHoldings: Array<{
    assetId: string
    symbol: string
    name: string
    value: number
    percentage: number
    performance: number
  }>
  concentration: {
    top5Percentage: number
    top10Percentage: number
    largestHoldingPercentage: number
  }
}

export interface RiskMetrics {
  riskScore: number // 1-10
  volatility30d: number
  volatility90d: number
  volatility1y: number
  valueAtRisk95: number // 95% VaR
  valueAtRisk99: number // 99% VaR
  downsideDeviation: number
  maxDrawdown: {
    value: number
    startDate: string
    endDate: string
    duration: number
  }
  correlation: {
    toMarket: number
    toSP500: number
  }
}

export interface DiversificationScore {
  overall: number // 0-100
  assetTypeDiversity: number
  sectorDiversity: number
  geographicDiversity: number
  recommendations: string[]
}

export interface ESGAnalysis {
  portfolioScore: number
  environmentalScore: number
  socialScore: number
  governanceScore: number
  carbonFootprint: number
  sustainableInvestmentPercentage: number
  impactMetrics: {
    co2Avoided: number
    renewableEnergySupported: number
    jobsCreated: number
  }
  topESGHoldings: Array<{
    symbol: string
    name: string
    esgScore: number
  }>
}

export interface ProjectionData {
  expectedReturn: {
    conservative: number
    moderate: number
    optimistic: number
  }
  projectedValue: {
    oneMonth: number
    threeMonths: number
    sixMonths: number
    oneYear: number
    fiveYears: number
  }
  monteCarloSimulation: {
    medianOutcome: number
    percentile10: number
    percentile90: number
    probabilityOfGain: number
  }
}

export class PortfolioAnalyticsService {
  static async getPortfolioAnalytics(portfolioId: string): Promise<PortfolioAnalytics> {
    const supabase = await createClient()
    
    // Get portfolio data with holdings and transactions
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        holdings!inner(
          *,
          asset:assets(*)
        ),
        transactions(
          *
        )
      `)
      .eq('id', portfolioId)
      .single()
    
    if (error || !portfolio) throw new Error('Portfolio not found')
    
    // Calculate all analytics
    const [performance, allocation, risk, diversification, esg, projections] = await Promise.all([
      this.calculatePerformanceMetrics(portfolio),
      this.calculateAllocation(portfolio),
      this.calculateRiskMetrics(portfolio),
      this.calculateDiversification(portfolio),
      this.calculateESGAnalysis(portfolio),
      this.calculateProjections(portfolio),
    ])
    
    return {
      portfolioId,
      performance,
      allocation,
      risk,
      diversification,
      esg,
      projections,
    }
  }
  
  static async comparePortfolios(portfolioIds: string[]): Promise<{
    portfolios: Array<{
      id: string
      name: string
      totalReturn: number
      annualizedReturn: number
      volatility: number
      sharpeRatio: number
      maxDrawdown: number
    }>
    correlationMatrix: number[][]
  }> {
    const supabase = await createClient()
    
    const portfolioData = await Promise.all(
      portfolioIds.map(async (id) => {
        const { data } = await supabase
          .from('portfolios')
          .select('*')
          .eq('id', id)
          .single()
        
        const analytics = await this.getPortfolioAnalytics(id)
        
        return {
          id,
          name: data?.name || 'Unknown',
          totalReturn: analytics.performance.totalReturn,
          annualizedReturn: analytics.performance.annualizedReturn,
          volatility: analytics.performance.volatility,
          sharpeRatio: analytics.performance.sharpeRatio,
          maxDrawdown: analytics.performance.maxDrawdown,
        }
      })
    )
    
    // Calculate correlation matrix
    const correlationMatrix = await this.calculateCorrelationMatrix(portfolioIds)
    
    return {
      portfolios: portfolioData,
      correlationMatrix,
    }
  }
  
  private static async calculatePerformanceMetrics(portfolio: any): Promise<PerformanceMetrics> {
    const totalValue = portfolio.total_value || 0
    const totalInvested = portfolio.total_invested || 0
    const totalReturn = totalValue - totalInvested
    const totalReturnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0
    
    // Get historical performance data
    const returns = await this.getHistoricalReturns(portfolio.id)
    
    // Calculate various return periods
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const yearStart = new Date(now.getFullYear(), 0, 1)
    
    const dailyReturn = this.calculateReturnForPeriod(returns, oneDayAgo, now)
    const weeklyReturn = this.calculateReturnForPeriod(returns, oneWeekAgo, now)
    const monthlyReturn = this.calculateReturnForPeriod(returns, oneMonthAgo, now)
    const yearToDateReturn = this.calculateReturnForPeriod(returns, yearStart, now)
    
    // Calculate risk-adjusted metrics
    const volatility = this.calculateVolatility(returns)
    const sharpeRatio = this.calculateSharpeRatio(totalReturnPercentage, volatility)
    const { alpha, beta } = await this.calculateAlphaBeta(returns)
    
    // Calculate drawdown
    const maxDrawdown = this.calculateMaxDrawdown(returns)
    
    // Calculate win rate
    const winRate = this.calculateWinRate(portfolio.transactions || [])
    
    // Find all-time high/low
    const { allTimeHigh, allTimeLow } = this.findExtremes(returns)
    
    // Annualized return (assuming portfolio age from created_at)
    const portfolioAge = (now.getTime() - new Date(portfolio.created_at).getTime()) / (365 * 24 * 60 * 60 * 1000)
    const annualizedReturn = portfolioAge > 0 ? Math.pow(1 + totalReturnPercentage / 100, 1 / portfolioAge) - 1 : 0
    
    return {
      totalReturn,
      totalReturnPercentage,
      annualizedReturn: annualizedReturn * 100,
      dailyReturn,
      weeklyReturn,
      monthlyReturn,
      yearToDateReturn,
      allTimeHigh,
      allTimeLow,
      sharpeRatio,
      volatility,
      alpha,
      beta,
      maxDrawdown,
      winRate,
    }
  }
  
  private static async calculateAllocation(portfolio: any): Promise<AllocationAnalysis> {
    const holdings = portfolio.holdings || []
    const totalValue = holdings.reduce((sum: number, h: any) => sum + (h.quantity * h.asset.current_price), 0)
    
    // Group by asset type
    const byAssetType = this.groupByProperty(holdings, 'asset.asset_type', totalValue)
    
    // Group by sector
    const bySector = this.groupByProperty(holdings, 'asset.sector', totalValue)
    
    // Group by region (assuming we have region data)
    const byRegion = this.groupByProperty(holdings, 'asset.region', totalValue)
    
    // Top holdings
    const topHoldings = holdings
      .map((h: any) => {
        const value = h.quantity * h.asset.current_price
        const cost = h.quantity * h.average_cost
        return {
          assetId: h.asset_id,
          symbol: h.asset.symbol,
          name: h.asset.name,
          value,
          percentage: (value / totalValue) * 100,
          performance: ((value - cost) / cost) * 100,
        }
      })
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10)
    
    // Calculate concentration
    const sortedHoldings = [...topHoldings].sort((a, b) => b.percentage - a.percentage)
    const top5Percentage = sortedHoldings.slice(0, 5).reduce((sum, h) => sum + h.percentage, 0)
    const top10Percentage = sortedHoldings.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0)
    const largestHoldingPercentage = sortedHoldings[0]?.percentage || 0
    
    return {
      byAssetType,
      bySector,
      byRegion,
      topHoldings,
      concentration: {
        top5Percentage,
        top10Percentage,
        largestHoldingPercentage,
      },
    }
  }
  
  private static async calculateRiskMetrics(portfolio: any): Promise<RiskMetrics> {
    const returns = await this.getHistoricalReturns(portfolio.id)
    
    // Calculate volatility for different periods
    const volatility30d = this.calculateVolatility(returns, 30)
    const volatility90d = this.calculateVolatility(returns, 90)
    const volatility1y = this.calculateVolatility(returns, 365)
    
    // Calculate Value at Risk
    const valueAtRisk95 = this.calculateVaR(returns, 0.95)
    const valueAtRisk99 = this.calculateVaR(returns, 0.99)
    
    // Calculate downside deviation
    const downsideDeviation = this.calculateDownsideDeviation(returns)
    
    // Calculate max drawdown with details
    const maxDrawdownDetails = this.calculateMaxDrawdownDetails(returns)
    
    // Calculate correlations
    const marketCorrelation = await this.calculateMarketCorrelation(returns)
    
    // Calculate overall risk score (1-10)
    const riskScore = this.calculateOverallRiskScore({
      volatility: volatility1y,
      maxDrawdown: maxDrawdownDetails.value,
      concentration: portfolio.holdings?.length || 0,
      beta: marketCorrelation.toSP500,
    })
    
    return {
      riskScore,
      volatility30d,
      volatility90d,
      volatility1y,
      valueAtRisk95,
      valueAtRisk99,
      downsideDeviation,
      maxDrawdown: maxDrawdownDetails,
      correlation: marketCorrelation,
    }
  }
  
  private static async calculateDiversification(portfolio: any): Promise<DiversificationScore> {
    const holdings = portfolio.holdings || []
    
    if (holdings.length === 0) {
      return {
        overall: 0,
        assetTypeDiversity: 0,
        sectorDiversity: 0,
        geographicDiversity: 0,
        recommendations: ['Add holdings to your portfolio to improve diversification'],
      }
    }
    
    // Calculate diversity scores using Herfindahl-Hirschman Index (HHI)
    const assetTypes = this.getUniqueValues(holdings, 'asset.asset_type')
    const sectors = this.getUniqueValues(holdings, 'asset.sector')
    const regions = this.getUniqueValues(holdings, 'asset.region')
    
    const assetTypeDiversity = this.calculateDiversityScore(holdings, 'asset.asset_type')
    const sectorDiversity = this.calculateDiversityScore(holdings, 'asset.sector')
    const geographicDiversity = this.calculateDiversityScore(holdings, 'asset.region')
    
    // Overall score is weighted average
    const overall = (assetTypeDiversity * 0.3 + sectorDiversity * 0.4 + geographicDiversity * 0.3)
    
    // Generate recommendations
    const recommendations = this.generateDiversificationRecommendations({
      holdings,
      assetTypes: assetTypes.length,
      sectors: sectors.length,
      regions: regions.length,
      overall,
    })
    
    return {
      overall,
      assetTypeDiversity,
      sectorDiversity,
      geographicDiversity,
      recommendations,
    }
  }
  
  private static async calculateESGAnalysis(portfolio: any): Promise<ESGAnalysis> {
    const holdings = portfolio.holdings || []
    const totalValue = holdings.reduce((sum: number, h: any) => sum + (h.quantity * h.asset.current_price), 0)
    
    if (holdings.length === 0 || totalValue === 0) {
      return {
        portfolioScore: 0,
        environmentalScore: 0,
        socialScore: 0,
        governanceScore: 0,
        carbonFootprint: 0,
        sustainableInvestmentPercentage: 0,
        impactMetrics: {
          co2Avoided: 0,
          renewableEnergySupported: 0,
          jobsCreated: 0,
        },
        topESGHoldings: [],
      }
    }
    
    // Calculate weighted ESG scores
    let totalESG = 0
    let totalEnvironmental = 0
    let totalSocial = 0
    let totalGovernance = 0
    let sustainableValue = 0
    
    holdings.forEach((h: any) => {
      const weight = (h.quantity * h.asset.current_price) / totalValue
      const esgScores = h.asset.esg_scores || {}
      
      totalESG += (esgScores.total || 0) * weight
      totalEnvironmental += (esgScores.environmental || 0) * weight
      totalSocial += (esgScores.social || 0) * weight
      totalGovernance += (esgScores.governance || 0) * weight
      
      if ((esgScores.total || 0) >= 70) {
        sustainableValue += h.quantity * h.asset.current_price
      }
    })
    
    // Calculate carbon footprint (mock calculation)
    const carbonFootprint = this.calculateCarbonFootprint(holdings)
    
    // Calculate impact metrics (mock calculation)
    const impactMetrics = {
      co2Avoided: totalValue * 0.0001 * (totalEnvironmental / 100), // tons
      renewableEnergySupported: totalValue * 0.05 * (totalEnvironmental / 100), // MWh
      jobsCreated: Math.floor(totalValue * 0.00001 * (totalSocial / 100)),
    }
    
    // Get top ESG holdings
    const topESGHoldings = holdings
      .filter((h: any) => h.asset.esg_scores?.total)
      .sort((a: any, b: any) => (b.asset.esg_scores?.total || 0) - (a.asset.esg_scores?.total || 0))
      .slice(0, 5)
      .map((h: any) => ({
        symbol: h.asset.symbol,
        name: h.asset.name,
        esgScore: h.asset.esg_scores.total,
      }))
    
    return {
      portfolioScore: Math.round(totalESG),
      environmentalScore: Math.round(totalEnvironmental),
      socialScore: Math.round(totalSocial),
      governanceScore: Math.round(totalGovernance),
      carbonFootprint,
      sustainableInvestmentPercentage: (sustainableValue / totalValue) * 100,
      impactMetrics,
      topESGHoldings,
    }
  }
  
  private static async calculateProjections(portfolio: any): Promise<ProjectionData> {
    const historicalReturns = await this.getHistoricalReturns(portfolio.id)
    const meanReturn = this.calculateMean(historicalReturns.map(r => r.return))
    const volatility = this.calculateVolatility(historicalReturns)
    
    const currentValue = portfolio.total_value || 0
    
    // Simple projections based on historical performance
    const conservativeReturn = meanReturn - volatility
    const moderateReturn = meanReturn
    const optimisticReturn = meanReturn + volatility
    
    // Project values for different time horizons
    const projectedValue = {
      oneMonth: currentValue * (1 + moderateReturn / 12),
      threeMonths: currentValue * (1 + moderateReturn / 4),
      sixMonths: currentValue * (1 + moderateReturn / 2),
      oneYear: currentValue * (1 + moderateReturn),
      fiveYears: currentValue * Math.pow(1 + moderateReturn, 5),
    }
    
    // Monte Carlo simulation (simplified)
    const monteCarloResults = this.runMonteCarloSimulation({
      initialValue: currentValue,
      meanReturn,
      volatility,
      years: 5,
      simulations: 1000,
    })
    
    return {
      expectedReturn: {
        conservative: conservativeReturn * 100,
        moderate: moderateReturn * 100,
        optimistic: optimisticReturn * 100,
      },
      projectedValue,
      monteCarloSimulation: monteCarloResults,
    }
  }
  
  // Helper methods
  private static async getHistoricalReturns(portfolioId: string): Promise<Array<{ date: string; value: number; return: number }>> {
    const supabase = await createClient()
    
    const { data: snapshots } = await supabase
      .from('portfolio_snapshots')
      .select('date, total_value')
      .eq('portfolio_id', portfolioId)
      .order('date', { ascending: true })
    
    if (!snapshots || snapshots.length < 2) {
      return []
    }
    
    const returns = []
    for (let i = 1; i < snapshots.length; i++) {
      const previousValue = snapshots[i - 1].total_value
      const currentValue = snapshots[i].total_value
      const dailyReturn = previousValue > 0 ? (currentValue - previousValue) / previousValue : 0
      
      returns.push({
        date: snapshots[i].date,
        value: currentValue,
        return: dailyReturn,
      })
    }
    
    return returns
  }
  
  private static calculateVolatility(returns: Array<{ return: number }>, days?: number): number {
    const relevantReturns = days 
      ? returns.slice(-days) 
      : returns
    
    if (relevantReturns.length < 2) return 0
    
    const dailyReturns = relevantReturns.map(r => r.return)
    const mean = this.calculateMean(dailyReturns)
    const squaredDiffs = dailyReturns.map(r => Math.pow(r - mean, 2))
    const variance = this.calculateMean(squaredDiffs)
    
    // Annualize the volatility
    return Math.sqrt(variance * 252) * 100
  }
  
  private static calculateMean(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }
  
  private static calculateSharpeRatio(annualReturn: number, annualVolatility: number, riskFreeRate = 2): number {
    if (annualVolatility === 0) return 0
    return (annualReturn - riskFreeRate) / annualVolatility
  }
  
  private static groupByProperty(items: any[], property: string, totalValue: number): any[] {
    const groups = new Map<string, { value: number; count: number }>()
    
    items.forEach((item: any) => {
      const keys = property.split('.')
      let value: any = item
      for (const key of keys) {
        value = value?.[key]
      }
      
      const groupKey = value || 'Other'
      const itemValue = item.quantity * item.asset.current_price
      
      const current = groups.get(groupKey) || { value: 0, count: 0 }
      groups.set(groupKey, {
        value: current.value + itemValue,
        count: current.count + 1,
      })
    })
    
    return Array.from(groups.entries())
      .map(([key, data]) => ({
        [property.split('.').pop()!]: key,
        value: data.value,
        percentage: (data.value / totalValue) * 100,
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value)
  }
  
  private static runMonteCarloSimulation(params: {
    initialValue: number
    meanReturn: number
    volatility: number
    years: number
    simulations: number
  }): any {
    const results: number[] = []
    
    for (let i = 0; i < params.simulations; i++) {
      let value = params.initialValue
      
      for (let year = 0; year < params.years; year++) {
        // Generate random return based on normal distribution
        const randomReturn = this.generateNormalRandom(params.meanReturn, params.volatility / 100)
        value *= (1 + randomReturn)
      }
      
      results.push(value)
    }
    
    results.sort((a, b) => a - b)
    
    const profitableOutcomes = results.filter(r => r > params.initialValue).length
    
    return {
      medianOutcome: results[Math.floor(results.length / 2)],
      percentile10: results[Math.floor(results.length * 0.1)],
      percentile90: results[Math.floor(results.length * 0.9)],
      probabilityOfGain: (profitableOutcomes / params.simulations) * 100,
    }
  }
  
  private static generateNormalRandom(mean: number, stdDev: number): number {
    // Box-Muller transform
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return mean + stdDev * z0
  }
  
  // Additional helper methods would go here...
  private static calculateReturnForPeriod(_returns: any[], _startDate: Date, _endDate: Date): number {
    // Implementation
    return 0
  }
  
  private static async calculateAlphaBeta(_returns: any[]): Promise<{ alpha: number; beta: number }> {
    // Implementation
    return { alpha: 0, beta: 0 }
  }
  
  private static calculateMaxDrawdown(_returns: any[]): number {
    // Implementation
    return 0
  }
  
  private static calculateMaxDrawdownDetails(_returns: any[]): any {
    // Implementation
    return { value: 0, startDate: '', endDate: '', duration: 0 }
  }
  
  private static calculateWinRate(_transactions: any[]): number {
    // Implementation
    return 0
  }
  
  private static findExtremes(_returns: any[]): { allTimeHigh: number; allTimeLow: number } {
    // Implementation
    return { allTimeHigh: 0, allTimeLow: 0 }
  }
  
  private static calculateVaR(_returns: any[], _confidence: number): number {
    // Implementation
    return 0
  }
  
  private static calculateDownsideDeviation(_returns: any[]): number {
    // Implementation
    return 0
  }
  
  private static async calculateMarketCorrelation(_returns: any[]): Promise<{ toMarket: number; toSP500: number }> {
    // Implementation
    return { toMarket: 0, toSP500: 0 }
  }
  
  private static calculateOverallRiskScore(_factors: any): number {
    // Implementation
    return 5
  }
  
  private static getUniqueValues(_items: any[], _property: string): string[] {
    // Implementation
    return []
  }
  
  private static calculateDiversityScore(_holdings: any[], _property: string): number {
    // Implementation using HHI
    return 50
  }
  
  private static generateDiversificationRecommendations(_data: any): string[] {
    // Implementation
    return []
  }
  
  private static calculateCarbonFootprint(_holdings: any[]): number {
    // Implementation
    return 0
  }
  
  private static async calculateCorrelationMatrix(portfolioIds: string[]): Promise<number[][]> {
    // Implementation
    return portfolioIds.map(() => portfolioIds.map(() => 0))
  }
}