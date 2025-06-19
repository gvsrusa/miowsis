import { PortfolioAnalyticsService } from '@/lib/portfolio/analytics.service'
import { createClient } from '@/lib/supabase/server'

export interface RiskProfile {
  userId: string
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive'
  investmentHorizon: 'short' | 'medium' | 'long' // <3y, 3-10y, >10y
  liquidityNeeds: 'low' | 'medium' | 'high'
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  age: number
  annualIncome: number
  netWorth: number
  investmentGoals: string[]
  constraints: string[]
  maxDrawdownTolerance: number // percentage
  preferredAssetTypes: string[]
  excludedSectors: string[]
}

export interface RiskAssessment {
  portfolioId: string
  overallRiskScore: number // 1-100
  riskCategory: 'low' | 'medium' | 'high' | 'very_high'
  alignment: {
    score: number // 0-100, how well portfolio aligns with risk profile
    misalignments: string[]
    recommendations: string[]
  }
  exposures: {
    concentration: ConcentrationRisk
    market: MarketRisk
    liquidity: LiquidityRisk
    currency: CurrencyRisk
    sector: SectorRisk
  }
  stressTests: StressTestResults
  alerts: RiskAlert[]
}

export interface ConcentrationRisk {
  level: 'low' | 'medium' | 'high'
  topHoldingExposure: number
  top5Exposure: number
  singleAssetLimit: number
  violations: Array<{
    assetId: string
    symbol: string
    exposure: number
    limit: number
  }>
}

export interface MarketRisk {
  beta: number
  correlation: number
  systematicRisk: number
  specificRisk: number
  trackingError?: number
}

export interface LiquidityRisk {
  level: 'low' | 'medium' | 'high'
  illiquidPercentage: number
  averageDailyVolume: number
  liquidationTime: number // days to liquidate 50% of portfolio
  illiquidHoldings: Array<{
    symbol: string
    percentage: number
    estimatedLiquidationDays: number
  }>
}

export interface CurrencyRisk {
  exposures: Array<{
    currency: string
    exposure: number
    hedged: boolean
  }>
  unhedgedExposure: number
}

export interface SectorRisk {
  concentrations: Array<{
    sector: string
    exposure: number
    benchmark: number
    overweight: number
  }>
  diversificationScore: number
}

export interface StressTestResults {
  scenarios: Array<{
    name: string
    description: string
    portfolioImpact: number // percentage loss
    worstHoldings: Array<{
      symbol: string
      impact: number
    }>
  }>
  historicalWorstCase: {
    period: string
    loss: number
    recovery: number // days to recover
  }
}

export interface RiskAlert {
  id: string
  severity: 'info' | 'warning' | 'critical'
  type: string
  title: string
  description: string
  actionRequired?: string
  createdAt: string
}

export interface RiskLimit {
  id: string
  userId: string
  limitType: 'position' | 'sector' | 'asset_type' | 'volatility' | 'var'
  metric: string
  operator: 'greater_than' | 'less_than' | 'equal_to'
  value: number
  action: 'alert' | 'block' | 'rebalance'
  enabled: boolean
}

export class RiskManagementService {
  static async createRiskProfile(userId: string, profile: Omit<RiskProfile, 'userId'>): Promise<RiskProfile> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('risk_profiles')
      .upsert({
        user_id: userId,
        ...profile,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      userId: data.user_id,
      ...data,
    }
  }
  
  static async getRiskProfile(userId: string): Promise<RiskProfile | null> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('risk_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error || !data) return null
    
    return {
      userId: data.user_id,
      ...data,
    }
  }
  
  static async assessPortfolioRisk(portfolioId: string, userId: string): Promise<RiskAssessment> {
    const [portfolio, riskProfile, analytics] = await Promise.all([
      this.getPortfolioData(portfolioId),
      this.getRiskProfile(userId),
      PortfolioAnalyticsService.getPortfolioAnalytics(portfolioId),
    ])
    
    if (!portfolio) throw new Error('Portfolio not found')
    
    // Calculate various risk exposures
    const [concentration, market, liquidity, currency, sector] = await Promise.all([
      this.assessConcentrationRisk(portfolio),
      this.assessMarketRisk(portfolio, analytics),
      this.assessLiquidityRisk(portfolio),
      this.assessCurrencyRisk(portfolio),
      this.assessSectorRisk(portfolio),
    ])
    
    // Run stress tests
    const stressTests = await this.runStressTests(portfolio)
    
    // Calculate overall risk score
    const overallRiskScore = this.calculateOverallRiskScore({
      concentration,
      market,
      liquidity,
      currency,
      sector,
      volatility: analytics.risk.volatility1y,
    })
    
    // Assess alignment with risk profile
    const alignment = riskProfile 
      ? this.assessProfileAlignment(riskProfile, overallRiskScore, portfolio)
      : { score: 50, misalignments: [], recommendations: [] }
    
    // Generate alerts
    const alerts = this.generateRiskAlerts({
      portfolio,
      concentration,
      market,
      liquidity,
      riskProfile,
      overallRiskScore,
    })
    
    return {
      portfolioId,
      overallRiskScore,
      riskCategory: this.categorizeRisk(overallRiskScore),
      alignment,
      exposures: {
        concentration,
        market,
        liquidity,
        currency,
        sector,
      },
      stressTests,
      alerts,
    }
  }
  
  static async setRiskLimits(userId: string, limits: Omit<RiskLimit, 'id' | 'userId'>[]): Promise<RiskLimit[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('risk_limits')
      .insert(
        limits.map(limit => ({
          user_id: userId,
          ...limit,
        }))
      )
      .select()
    
    if (error) throw error
    
    return data || []
  }
  
  static async checkRiskLimits(portfolioId: string, userId: string): Promise<{
    violations: Array<{
      limit: RiskLimit
      currentValue: number
      message: string
    }>
    passed: boolean
  }> {
    const supabase = await createClient()
    
    // Get user's risk limits
    const { data: limits } = await supabase
      .from('risk_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true)
    
    if (!limits || limits.length === 0) {
      return { violations: [], passed: true }
    }
    
    // Get portfolio data and analytics
    const [portfolio, analytics] = await Promise.all([
      this.getPortfolioData(portfolioId),
      PortfolioAnalyticsService.getPortfolioAnalytics(portfolioId),
    ])
    
    const violations = []
    
    for (const limit of limits) {
      const currentValue = await this.evaluateLimitMetric(limit, portfolio, analytics)
      const isViolated = this.checkLimitViolation(currentValue, limit)
      
      if (isViolated) {
        violations.push({
          limit,
          currentValue,
          message: `${limit.limitType} limit violated: ${limit.metric} is ${currentValue} (limit: ${limit.operator} ${limit.value})`,
        })
      }
    }
    
    return {
      violations,
      passed: violations.length === 0,
    }
  }
  
  static async generateRebalancingSuggestions(portfolioId: string, userId: string): Promise<{
    suggestions: Array<{
      action: 'buy' | 'sell'
      assetId: string
      symbol: string
      currentWeight: number
      targetWeight: number
      suggestedAmount: number
      reason: string
    }>
    estimatedRiskReduction: number
  }> {
    const [portfolio, riskProfile, assessment] = await Promise.all([
      this.getPortfolioData(portfolioId),
      this.getRiskProfile(userId),
      this.assessPortfolioRisk(portfolioId, userId),
    ])
    
    if (!portfolio || !riskProfile) {
      return { suggestions: [], estimatedRiskReduction: 0 }
    }
    
    const suggestions = []
    const totalValue = portfolio.total_value || 0
    
    // Address concentration risk
    if (assessment.exposures.concentration.level === 'high') {
      for (const violation of assessment.exposures.concentration.violations) {
        const currentWeight = violation.exposure
        const targetWeight = violation.limit
        const reductionAmount = (currentWeight - targetWeight) * totalValue / 100
        
        suggestions.push({
          action: 'sell' as const,
          assetId: violation.assetId,
          symbol: violation.symbol,
          currentWeight,
          targetWeight,
          suggestedAmount: reductionAmount,
          reason: 'Reduce concentration risk',
        })
      }
    }
    
    // Suggest diversification
    if (assessment.exposures.sector.diversificationScore < 50) {
      const underweightSectors = this.identifyUnderweightSectors(portfolio, riskProfile)
      
      for (const sector of underweightSectors) {
        // Find suitable assets in the sector
        const assets = await this.findSuitableAssets(sector, riskProfile)
        
        if (assets.length > 0) {
          suggestions.push({
            action: 'buy' as const,
            assetId: assets[0].id,
            symbol: assets[0].symbol,
            currentWeight: 0,
            targetWeight: 5, // 5% allocation
            suggestedAmount: totalValue * 0.05,
            reason: `Increase exposure to ${sector} sector for diversification`,
          })
        }
      }
    }
    
    // Calculate estimated risk reduction
    const estimatedRiskReduction = this.estimateRiskReduction(portfolio, suggestions)
    
    return {
      suggestions: suggestions.slice(0, 10), // Limit to top 10 suggestions
      estimatedRiskReduction,
    }
  }
  
  // Private helper methods
  private static async getPortfolioData(portfolioId: string): Promise<any> {
    const supabase = await createClient()
    
    const { data } = await supabase
      .from('portfolios')
      .select(`
        *,
        holdings!inner(
          *,
          asset:assets(*)
        )
      `)
      .eq('id', portfolioId)
      .single()
    
    return data
  }
  
  private static async assessConcentrationRisk(portfolio: any): Promise<ConcentrationRisk> {
    const holdings = portfolio.holdings || []
    const totalValue = holdings.reduce((sum: number, h: any) => sum + (h.quantity * h.asset.current_price), 0)
    
    if (totalValue === 0) {
      return {
        level: 'low',
        topHoldingExposure: 0,
        top5Exposure: 0,
        singleAssetLimit: 25,
        violations: [],
      }
    }
    
    // Calculate exposures
    const exposures = holdings
      .map((h: any) => ({
        assetId: h.asset_id,
        symbol: h.asset.symbol,
        value: h.quantity * h.asset.current_price,
        exposure: ((h.quantity * h.asset.current_price) / totalValue) * 100,
      }))
      .sort((a: any, b: any) => b.exposure - a.exposure)
    
    const topHoldingExposure = exposures[0]?.exposure || 0
    const top5Exposure = exposures.slice(0, 5).reduce((sum: number, e: any) => sum + e.exposure, 0)
    
    // Check violations (assuming 25% single asset limit)
    const singleAssetLimit = 25
    const violations = exposures
      .filter((e: any) => e.exposure > singleAssetLimit)
      .map((e: any) => ({ ...e, limit: singleAssetLimit }))
    
    // Determine risk level
    let level: 'low' | 'medium' | 'high' = 'low'
    if (topHoldingExposure > 40 || top5Exposure > 80) {
      level = 'high'
    } else if (topHoldingExposure > 25 || top5Exposure > 60) {
      level = 'medium'
    }
    
    return {
      level,
      topHoldingExposure,
      top5Exposure,
      singleAssetLimit,
      violations,
    }
  }
  
  private static async assessMarketRisk(_portfolio: any, analytics: any): Promise<MarketRisk> {
    return {
      beta: analytics.performance.beta || 1,
      correlation: analytics.risk.correlation.toSP500 || 0,
      systematicRisk: 0.7, // Placeholder
      specificRisk: 0.3, // Placeholder
      trackingError: 0, // Placeholder
    }
  }
  
  private static async assessLiquidityRisk(portfolio: any): Promise<LiquidityRisk> {
    const holdings = portfolio.holdings || []
    const totalValue = holdings.reduce((sum: number, h: any) => sum + (h.quantity * h.asset.current_price), 0)
    
    if (totalValue === 0) {
      return {
        level: 'low',
        illiquidPercentage: 0,
        averageDailyVolume: 0,
        liquidationTime: 0,
        illiquidHoldings: [],
      }
    }
    
    // Assess liquidity based on asset type and volume
    let illiquidValue = 0
    const illiquidHoldings = []
    
    for (const holding of holdings) {
      const liquidity = this.assessAssetLiquidity(holding.asset)
      
      if (liquidity.isIlliquid) {
        illiquidValue += holding.quantity * holding.asset.current_price
        illiquidHoldings.push({
          symbol: holding.asset.symbol,
          percentage: ((holding.quantity * holding.asset.current_price) / totalValue) * 100,
          estimatedLiquidationDays: liquidity.liquidationDays,
        })
      }
    }
    
    const illiquidPercentage = (illiquidValue / totalValue) * 100
    
    // Determine risk level
    let level: 'low' | 'medium' | 'high' = 'low'
    if (illiquidPercentage > 30) {
      level = 'high'
    } else if (illiquidPercentage > 15) {
      level = 'medium'
    }
    
    return {
      level,
      illiquidPercentage,
      averageDailyVolume: 1000000, // Placeholder
      liquidationTime: illiquidPercentage / 10, // Rough estimate
      illiquidHoldings,
    }
  }
  
  private static assessAssetLiquidity(asset: any): { isIlliquid: boolean; liquidationDays: number } {
    // Simple heuristic based on asset type and volume
    if (asset.asset_type === 'crypto' && asset.market_cap < 1000000) {
      return { isIlliquid: true, liquidationDays: 7 }
    }
    
    if (asset.volume < 100000) {
      return { isIlliquid: true, liquidationDays: 5 }
    }
    
    return { isIlliquid: false, liquidationDays: 1 }
  }
  
  private static async assessCurrencyRisk(_portfolio: any): Promise<CurrencyRisk> {
    // Simplified - assumes USD base
    return {
      exposures: [
        {
          currency: 'USD',
          exposure: 100,
          hedged: false,
        },
      ],
      unhedgedExposure: 0,
    }
  }
  
  private static async assessSectorRisk(portfolio: any): Promise<SectorRisk> {
    const holdings = portfolio.holdings || []
    const totalValue = holdings.reduce((sum: number, h: any) => sum + (h.quantity * h.asset.current_price), 0)
    
    if (totalValue === 0) {
      return {
        concentrations: [],
        diversificationScore: 0,
      }
    }
    
    // Group by sector
    const sectorMap = new Map<string, number>()
    
    holdings.forEach((h: any) => {
      const sector = h.asset.sector || 'Other'
      const value = h.quantity * h.asset.current_price
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + value)
    })
    
    const concentrations = Array.from(sectorMap.entries())
      .map(([sector, value]) => ({
        sector,
        exposure: (value / totalValue) * 100,
        benchmark: 10, // Placeholder benchmark
        overweight: ((value / totalValue) * 100) - 10,
      }))
      .sort((a, b) => b.exposure - a.exposure)
    
    // Calculate diversification score (0-100)
    const diversificationScore = Math.min(
      100,
      concentrations.length * 10 + (100 - Math.max(...concentrations.map(c => c.exposure)))
    )
    
    return {
      concentrations,
      diversificationScore,
    }
  }
  
  private static async runStressTests(portfolio: any): Promise<StressTestResults> {
    const scenarios = [
      {
        name: 'Market Crash',
        description: '2008-style financial crisis',
        impacts: { stock: -40, etf: -35, crypto: -60, bond: -5 },
      },
      {
        name: 'Tech Bubble Burst',
        description: 'Technology sector correction',
        impacts: { tech: -50, other: -20 },
      },
      {
        name: 'Interest Rate Shock',
        description: 'Rapid rate increase',
        impacts: { bond: -15, stock: -20, real_estate: -25 },
      },
    ]
    
    const results = scenarios.map(scenario => {
      const impact = this.calculateScenarioImpact(portfolio, scenario)
      return {
        name: scenario.name,
        description: scenario.description,
        portfolioImpact: impact.totalImpact,
        worstHoldings: impact.worstHoldings,
      }
    })
    
    return {
      scenarios: results,
      historicalWorstCase: {
        period: '2008 Financial Crisis',
        loss: -38.5,
        recovery: 365,
      },
    }
  }
  
  private static calculateScenarioImpact(portfolio: any, scenario: any): any {
    // Simplified stress test calculation
    let totalImpact = 0
    const impacts: any[] = []
    
    portfolio.holdings?.forEach((h: any) => {
      const assetType = h.asset.asset_type
      const {sector} = h.asset
      
      const impact = scenario.impacts[assetType] || scenario.impacts[sector] || scenario.impacts.other || -10
      
      impacts.push({
        symbol: h.asset.symbol,
        impact,
      })
      
      const holdingValue = h.quantity * h.asset.current_price
      const holdingWeight = holdingValue / (portfolio.total_value || 1)
      totalImpact += impact * holdingWeight
    })
    
    return {
      totalImpact,
      worstHoldings: impacts.sort((a, b) => a.impact - b.impact).slice(0, 5),
    }
  }
  
  private static calculateOverallRiskScore(factors: any): number {
    // Weighted average of different risk factors
    const weights = {
      concentration: 0.25,
      volatility: 0.3,
      liquidity: 0.15,
      market: 0.2,
      sector: 0.1,
    }
    
    const scores = {
      concentration: factors.concentration.level === 'high' ? 80 : factors.concentration.level === 'medium' ? 50 : 20,
      volatility: Math.min(100, factors.volatility * 2),
      liquidity: factors.liquidity.level === 'high' ? 70 : factors.liquidity.level === 'medium' ? 40 : 10,
      market: Math.min(100, Math.abs(factors.market.beta - 1) * 50),
      sector: 100 - factors.sector.diversificationScore,
    }
    
    return Object.entries(weights).reduce(
      (total, [key, weight]) => total + (scores[key as keyof typeof scores] * weight),
      0
    )
  }
  
  private static categorizeRisk(score: number): 'low' | 'medium' | 'high' | 'very_high' {
    if (score < 25) return 'low'
    if (score < 50) return 'medium'
    if (score < 75) return 'high'
    return 'very_high'
  }
  
  private static assessProfileAlignment(profile: RiskProfile, riskScore: number, _portfolio: any): any {
    const targetRiskScore = {
      conservative: 25,
      moderate: 50,
      aggressive: 75,
      very_aggressive: 90,
    }[profile.riskTolerance]
    
    const scoreDiff = Math.abs(riskScore - targetRiskScore)
    const alignmentScore = Math.max(0, 100 - scoreDiff * 2)
    
    const misalignments = []
    const recommendations = []
    
    if (scoreDiff > 20) {
      if (riskScore > targetRiskScore) {
        misalignments.push('Portfolio risk exceeds your risk tolerance')
        recommendations.push('Consider reducing exposure to high-risk assets')
        recommendations.push('Increase allocation to bonds or stable assets')
      } else {
        misalignments.push('Portfolio is too conservative for your risk tolerance')
        recommendations.push('Consider increasing equity allocation')
        recommendations.push('Add growth-oriented assets to the portfolio')
      }
    }
    
    return {
      score: alignmentScore,
      misalignments,
      recommendations,
    }
  }
  
  private static generateRiskAlerts(data: any): RiskAlert[] {
    const alerts: RiskAlert[] = []
    
    // Concentration alerts
    if (data.concentration.level === 'high') {
      alerts.push({
        id: 'concentration-high',
        severity: 'warning',
        type: 'concentration',
        title: 'High concentration risk detected',
        description: `Your top holding represents ${data.concentration.topHoldingExposure.toFixed(1)}% of your portfolio`,
        actionRequired: 'Consider diversifying to reduce single-asset exposure',
        createdAt: new Date().toISOString(),
      })
    }
    
    // Liquidity alerts
    if (data.liquidity.illiquidPercentage > 20) {
      alerts.push({
        id: 'liquidity-warning',
        severity: 'warning',
        type: 'liquidity',
        title: 'Limited liquidity in portfolio',
        description: `${data.liquidity.illiquidPercentage.toFixed(1)}% of your portfolio may be difficult to sell quickly`,
        actionRequired: 'Maintain adequate cash reserves for emergencies',
        createdAt: new Date().toISOString(),
      })
    }
    
    // Risk profile mismatch
    if (data.riskProfile && data.overallRiskScore) {
      const expectedRisk = {
        conservative: 25,
        moderate: 50,
        aggressive: 75,
        very_aggressive: 90,
      }[data.riskProfile.riskTolerance as keyof { conservative: number; moderate: number; aggressive: number; very_aggressive: number; }]
      
      if (Math.abs(data.overallRiskScore - expectedRisk) > 25) {
        alerts.push({
          id: 'profile-mismatch',
          severity: 'critical',
          type: 'profile',
          title: 'Portfolio risk doesn\'t match your profile',
          description: 'Your portfolio risk level significantly differs from your stated risk tolerance',
          actionRequired: 'Review and rebalance your portfolio or update your risk profile',
          createdAt: new Date().toISOString(),
        })
      }
    }
    
    return alerts
  }
  
  private static async evaluateLimitMetric(limit: RiskLimit, portfolio: any, analytics: any): Promise<number> {
    switch (limit.limitType) {
      case 'position':
        // Return position size as percentage
        const holding = portfolio.holdings?.find((h: any) => h.asset.symbol === limit.metric)
        if (!holding) return 0
        return ((holding.quantity * holding.asset.current_price) / portfolio.total_value) * 100
      
      case 'volatility':
        return analytics.risk.volatility1y
      
      case 'var':
        return analytics.risk.valueAtRisk95
      
      default:
        return 0
    }
  }
  
  private static checkLimitViolation(value: number, limit: RiskLimit): boolean {
    switch (limit.operator) {
      case 'greater_than':
        return value > limit.value
      case 'less_than':
        return value < limit.value
      case 'equal_to':
        return Math.abs(value - limit.value) < 0.01
      default:
        return false
    }
  }
  
  private static identifyUnderweightSectors(portfolio: any, _profile: RiskProfile): string[] {
    // Simplified - return sectors that should be added for diversification
    const currentSectors = new Set(portfolio.holdings?.map((h: any) => h.asset.sector).filter(Boolean))
    const recommendedSectors = ['Technology', 'Healthcare', 'Financials', 'Consumer', 'Industrials']
    
    return recommendedSectors.filter(s => !currentSectors.has(s)).slice(0, 3)
  }
  
  private static async findSuitableAssets(sector: string, _profile: RiskProfile): Promise<any[]> {
    // Placeholder - would query assets based on sector and risk profile
    return [
      {
        id: 'placeholder-id',
        symbol: 'SPY',
        sector,
      },
    ]
  }
  
  private static estimateRiskReduction(_portfolio: any, suggestions: any[]): number {
    // Simplified calculation
    let reduction = 0
    
    suggestions.forEach(s => {
      if (s.action === 'sell' && s.reason.includes('concentration')) {
        reduction += 5
      } else if (s.action === 'buy' && s.reason.includes('diversification')) {
        reduction += 3
      }
    })
    
    return Math.min(reduction, 30) // Cap at 30% reduction
  }
}