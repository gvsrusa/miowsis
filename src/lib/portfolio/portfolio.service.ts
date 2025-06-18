import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreatePortfolioData {
  name: string
  currency?: string
  target_allocation?: Record<string, number>
}

export interface UpdatePortfolioData {
  name?: string
  currency?: string
  target_allocation?: Record<string, number>
  is_active?: boolean
}

export interface PortfolioWithStats {
  id: string
  user_id: string
  name: string
  currency: string
  total_value: number
  total_invested: number
  total_returns: number
  esg_score: number
  carbon_offset: number
  target_allocation: Record<string, number>
  is_active: boolean
  created_at: string
  updated_at: string
  holdings_count: number
  last_transaction_at: string | null
}

export class PortfolioService {
  static async createPortfolio(userId: string, data: CreatePortfolioData) {
    const supabase = await createClient()
    
    // Check if user already has 5 portfolios
    const { count } = await supabase
      .from('portfolios')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (count && count >= 5) {
      throw new Error('Maximum portfolio limit reached. You can have up to 5 portfolios.')
    }
    
    // Create the portfolio
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name: data.name,
        currency: data.currency || 'USD',
        target_allocation: data.target_allocation || {},
        is_active: true,
      })
      .select()
      .single()
    
    if (error) throw error
    
    // If this is the first portfolio, ensure it's active
    if (count === 0 && portfolio) {
      await supabase
        .from('portfolios')
        .update({ is_active: true })
        .eq('id', portfolio.id)
    }
    
    revalidatePath('/dashboard')
    revalidatePath('/portfolios')
    
    return portfolio
  }
  
  static async getPortfolios(userId: string): Promise<PortfolioWithStats[]> {
    const supabase = await createClient()
    
    // Get portfolios with aggregated stats
    const { data: portfolios, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        holdings:holdings(count),
        transactions:transactions(
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Transform the data to include stats
    return portfolios.map(portfolio => ({
      ...portfolio,
      holdings_count: portfolio.holdings?.[0]?.count || 0,
      last_transaction_at: portfolio.transactions?.[0]?.created_at || null,
    }))
  }
  
  static async getPortfolio(userId: string, portfolioId: string) {
    const supabase = await createClient()
    
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        holdings:holdings(
          *,
          asset:assets(*)
        ),
        transactions:transactions(*)
      `)
      .eq('id', portfolioId)
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    if (!portfolio) throw new Error('Portfolio not found')
    
    return portfolio
  }
  
  static async updatePortfolio(
    userId: string, 
    portfolioId: string, 
    data: UpdatePortfolioData
  ) {
    const supabase = await createClient()
    
    // If setting as active, deactivate other portfolios first
    if (data.is_active === true) {
      await supabase
        .from('portfolios')
        .update({ is_active: false })
        .eq('user_id', userId)
        .neq('id', portfolioId)
    }
    
    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .update(data)
      .eq('id', portfolioId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/dashboard')
    revalidatePath('/portfolios')
    revalidatePath(`/portfolios/${portfolioId}`)
    
    return portfolio
  }
  
  static async deletePortfolio(userId: string, portfolioId: string) {
    const supabase = await createClient()
    
    // Check if portfolio has holdings
    const { count } = await supabase
      .from('holdings')
      .select('*', { count: 'exact', head: true })
      .eq('portfolio_id', portfolioId)
    
    if (count && count > 0) {
      throw new Error('Cannot delete portfolio with holdings. Please sell all holdings first.')
    }
    
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId)
      .eq('user_id', userId)
    
    if (error) throw error
    
    revalidatePath('/dashboard')
    revalidatePath('/portfolios')
    
    return { success: true }
  }
  
  static async setActivePortfolio(userId: string, portfolioId: string) {
    return this.updatePortfolio(userId, portfolioId, { is_active: true })
  }
  
  static async calculateReturns(portfolioId: string) {
    const supabase = await createClient()
    
    // Get all holdings with their current values
    const { data: holdings, error } = await supabase
      .from('holdings')
      .select(`
        quantity,
        average_cost,
        asset:assets!inner(
          symbol,
          current_price
        )
      `)
      .eq('portfolio_id', portfolioId)
    
    if (error) throw error
    
    // Type guard for holdings
    type HoldingWithAsset = {
      quantity: number
      average_cost: number
      asset: {
        symbol: string
        current_price: number
      }
    }
    
    const typedHoldings = holdings as unknown as HoldingWithAsset[]
    
    let totalValue = 0
    let totalInvested = 0
    
    typedHoldings.forEach(holding => {
      const currentValue = holding.quantity * (holding.asset?.current_price || 0)
      const invested = holding.quantity * holding.average_cost
      
      totalValue += currentValue
      totalInvested += invested
    })
    
    const totalReturns = totalValue - totalInvested
    const returnsPercentage = totalInvested > 0 
      ? ((totalReturns / totalInvested) * 100) 
      : 0
    
    // Update portfolio with calculated values
    await supabase
      .from('portfolios')
      .update({
        total_value: totalValue,
        total_invested: totalInvested,
        total_returns: totalReturns,
      })
      .eq('id', portfolioId)
    
    return {
      totalValue,
      totalInvested,
      totalReturns,
      returnsPercentage,
    }
  }
}