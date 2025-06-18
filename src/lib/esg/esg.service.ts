import { createClient } from '@/lib/supabase/server'

export interface ESGScore {
  total_score: number
  environmental_score: number
  social_score: number
  governance_score: number
  carbon_footprint: number
  renewable_energy_percentage: number
  diversity_score: number
  transparency_score: number
}

export interface AssetESGData {
  asset_id: string
  symbol: string
  name: string
  esg_scores: ESGScore
  last_updated: string
}

export interface PortfolioESGImpact {
  portfolio_id: string
  weighted_esg_score: number
  total_carbon_footprint: number
  total_carbon_offset: number
  net_carbon_impact: number
  renewable_energy_exposure: number
  social_impact_score: number
  governance_rating: string
  top_esg_holdings: AssetESGData[]
  bottom_esg_holdings: AssetESGData[]
  recommendations: ESGRecommendation[]
}

export interface ESGRecommendation {
  type: 'improve' | 'divest' | 'invest'
  asset_symbol: string
  asset_name: string
  reason: string
  potential_impact: number
}

export class ESGService {
  static async calculateAssetESGScore(_assetId: string): Promise<ESGScore> {
    // In a real implementation, this would fetch from an ESG data provider
    // For now, we'll generate realistic mock data
    const environmental = Math.floor(Math.random() * 30) + 60
    const social = Math.floor(Math.random() * 30) + 60
    const governance = Math.floor(Math.random() * 30) + 60
    
    return {
      total_score: Math.round((environmental + social + governance) / 3),
      environmental_score: environmental,
      social_score: social,
      governance_score: governance,
      carbon_footprint: Math.random() * 100,
      renewable_energy_percentage: Math.random() * 100,
      diversity_score: Math.random() * 100,
      transparency_score: Math.random() * 100,
    }
  }
  
  static async updateAssetESGScores(assetId: string) {
    const supabase = await createClient()
    
    try {
      const scores = await this.calculateAssetESGScore(assetId)
      
      const { error } = await supabase
        .from('esg_metrics')
        .upsert({
          asset_id: assetId,
          environmental_score: scores.environmental_score,
          social_score: scores.social_score,
          governance_score: scores.governance_score,
          total_score: scores.total_score,
          carbon_footprint: scores.carbon_footprint,
          last_updated: new Date().toISOString(),
        })
      
      if (error) throw error
      
      return scores
    } catch (error) {
      console.error('Error updating ESG scores:', error)
      throw error
    }
  }
  
  static async getPortfolioESGImpact(portfolioId: string): Promise<PortfolioESGImpact> {
    const supabase = await createClient()
    
    // Get portfolio holdings with ESG data
    const { data: holdings, error } = await supabase
      .from('holdings')
      .select(`
        quantity,
        asset:assets!inner(
          id,
          symbol,
          name,
          current_price,
          esg_metrics:esg_metrics(*)
        )
      `)
      .eq('portfolio_id', portfolioId)
    
    if (error) throw error
    
    // Type guard to ensure proper typing
    type HoldingWithAsset = {
      quantity: number
      asset: {
        id: string
        symbol: string
        name: string
        current_price: number
        esg_metrics: Array<{
          total_score: number
          environmental_score: number
          social_score: number
          governance_score: number
          carbon_footprint: number
          last_updated: string
        }>
      }
    }
    
    const typedHoldings = holdings as unknown as HoldingWithAsset[]
    
    // Calculate weighted ESG score
    let totalValue = 0
    let weightedESGSum = 0
    let totalCarbonFootprint = 0
    let renewableEnergySum = 0
    let socialImpactSum = 0
    
    const assetESGData: AssetESGData[] = []
    
    typedHoldings.forEach(holding => {
      const value = holding.quantity * (holding.asset?.current_price || 0)
      totalValue += value
      
      const esgMetrics = holding.asset?.esg_metrics?.[0]
      if (esgMetrics) {
        const esgScore = esgMetrics.total_score || 0
        weightedESGSum += esgScore * value
        totalCarbonFootprint += (esgMetrics.carbon_footprint || 0) * holding.quantity
        renewableEnergySum += (esgMetrics.environmental_score || 0) * value
        socialImpactSum += (esgMetrics.social_score || 0) * value
        
        assetESGData.push({
          asset_id: holding.asset.id,
          symbol: holding.asset.symbol,
          name: holding.asset.name,
          esg_scores: {
            total_score: esgMetrics.total_score,
            environmental_score: esgMetrics.environmental_score,
            social_score: esgMetrics.social_score,
            governance_score: esgMetrics.governance_score,
            carbon_footprint: esgMetrics.carbon_footprint,
            renewable_energy_percentage: 0,
            diversity_score: 0,
            transparency_score: 0,
          },
          last_updated: esgMetrics.last_updated,
        })
      }
    })
    
    const weightedESGScore = totalValue > 0 ? Math.round(weightedESGSum / totalValue) : 0
    const renewableEnergyExposure = totalValue > 0 ? Math.round(renewableEnergySum / totalValue) : 0
    const socialImpactScore = totalValue > 0 ? Math.round(socialImpactSum / totalValue) : 0
    
    // Sort holdings by ESG score
    assetESGData.sort((a, b) => b.esg_scores.total_score - a.esg_scores.total_score)
    
    // Generate recommendations
    const recommendations = this.generateESGRecommendations(assetESGData, weightedESGScore)
    
    // Update portfolio ESG score
    await supabase
      .from('portfolios')
      .update({
        esg_score: weightedESGScore,
        carbon_offset: totalCarbonFootprint * 0.1, // Mock offset calculation
      })
      .eq('id', portfolioId)
    
    return {
      portfolio_id: portfolioId,
      weighted_esg_score: weightedESGScore,
      total_carbon_footprint: totalCarbonFootprint,
      total_carbon_offset: totalCarbonFootprint * 0.1,
      net_carbon_impact: totalCarbonFootprint * 0.9,
      renewable_energy_exposure: renewableEnergyExposure,
      social_impact_score: socialImpactScore,
      governance_rating: this.getGovernanceRating(weightedESGScore),
      top_esg_holdings: assetESGData.slice(0, 3),
      bottom_esg_holdings: assetESGData.slice(-3),
      recommendations,
    }
  }
  
  private static generateESGRecommendations(
    holdings: AssetESGData[],
    portfolioScore: number
  ): ESGRecommendation[] {
    const recommendations: ESGRecommendation[] = []
    
    // Recommend divesting from low ESG holdings
    holdings
      .filter(h => h.esg_scores.total_score < 50)
      .slice(0, 2)
      .forEach(holding => {
        recommendations.push({
          type: 'divest',
          asset_symbol: holding.symbol,
          asset_name: holding.name,
          reason: `Low ESG score (${holding.esg_scores.total_score}/100) drags down portfolio sustainability`,
          potential_impact: Math.round((portfolioScore - holding.esg_scores.total_score) * 0.1),
        })
      })
    
    // Recommend improving holdings with moderate scores
    holdings
      .filter(h => h.esg_scores.total_score >= 50 && h.esg_scores.total_score < 70)
      .slice(0, 2)
      .forEach(holding => {
        recommendations.push({
          type: 'improve',
          asset_symbol: holding.symbol,
          asset_name: holding.name,
          reason: `Moderate ESG score could be improved through engagement`,
          potential_impact: Math.round((70 - holding.esg_scores.total_score) * 0.05),
        })
      })
    
    // Recommend high ESG investments if portfolio score is low
    if (portfolioScore < 70) {
      recommendations.push({
        type: 'invest',
        asset_symbol: 'ICLN',
        asset_name: 'iShares Global Clean Energy ETF',
        reason: 'Boost portfolio ESG score with clean energy exposure',
        potential_impact: 15,
      })
    }
    
    return recommendations
  }
  
  private static getGovernanceRating(score: number): string {
    if (score >= 80) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Moderate'
    if (score >= 50) return 'Fair'
    return 'Poor'
  }
  
  static async trackImpactMetrics(portfolioId: string) {
    const supabase = await createClient()
    
    const impact = await this.getPortfolioESGImpact(portfolioId)
    
    // Store impact metrics for tracking
    const { error } = await supabase
      .from('impact_tracking')
      .insert({
        portfolio_id: portfolioId,
        esg_score: impact.weighted_esg_score,
        carbon_footprint: impact.total_carbon_footprint,
        carbon_offset: impact.total_carbon_offset,
        renewable_exposure: impact.renewable_energy_exposure,
        social_impact: impact.social_impact_score,
        recorded_at: new Date().toISOString(),
      })
    
    if (error) console.error('Error tracking impact metrics:', error)
    
    return impact
  }
}