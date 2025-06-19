import { createClient } from '@/lib/supabase/server'

export type AssetType = 'stock' | 'etf' | 'crypto' | 'bond' | 'commodity'
export type MarketStatus = 'open' | 'closed' | 'pre_market' | 'after_hours'
export type PriceChangeInterval = '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | '5y'

export interface Asset {
  id: string
  symbol: string
  name: string
  asset_type: AssetType
  current_price: number
  previous_close: number
  price_change: number
  price_change_percentage: number
  market_cap: number
  volume: number
  high_24h: number
  low_24h: number
  open_price: number
  sector?: string
  industry?: string
  exchange?: string
  currency: string
  last_updated: string
  esg_scores?: {
    environmental: number
    social: number
    governance: number
    total: number
  }
}

export interface AssetPriceHistory {
  asset_id: string
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketIndex {
  symbol: string
  name: string
  value: number
  change: number
  change_percentage: number
  timestamp: string
}

export interface AssetSearchResult {
  symbol: string
  name: string
  type: AssetType
  exchange: string
  currency: string
}

export interface MarketData {
  status: MarketStatus
  indexes: MarketIndex[]
  trending: Asset[]
  gainers: Asset[]
  losers: Asset[]
  most_active: Asset[]
  timestamp: string
}

export class AssetService {
  static async getAsset(assetId: string): Promise<Asset | null> {
    const supabase = await createClient()
    
    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single()
    
    if (error) throw error
    
    return this.calculatePriceMetrics(asset)
  }
  
  static async getAssetBySymbol(symbol: string): Promise<Asset | null> {
    const supabase = await createClient()
    
    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .single()
    
    if (error) throw error
    
    return this.calculatePriceMetrics(asset)
  }
  
  static async searchAssets(query: string, filters?: {
    type?: AssetType
    sector?: string
    minMarketCap?: number
    maxMarketCap?: number
  }): Promise<AssetSearchResult[]> {
    const supabase = await createClient()
    
    let searchQuery = supabase
      .from('assets')
      .select('symbol, name, asset_type, exchange, currency')
      .or(`symbol.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(20)
    
    if (filters?.type) {
      searchQuery = searchQuery.eq('asset_type', filters.type)
    }
    
    if (filters?.sector) {
      searchQuery = searchQuery.eq('sector', filters.sector)
    }
    
    if (filters?.minMarketCap) {
      searchQuery = searchQuery.gte('market_cap', filters.minMarketCap)
    }
    
    if (filters?.maxMarketCap) {
      searchQuery = searchQuery.lte('market_cap', filters.maxMarketCap)
    }
    
    const { data: results, error } = await searchQuery
    
    if (error) throw error
    
    return results?.map(r => ({
      symbol: r.symbol,
      name: r.name,
      type: r.asset_type as AssetType,
      exchange: r.exchange || 'NYSE',
      currency: r.currency || 'USD'
    })) || []
  }
  
  static async getAssetPriceHistory(
    assetId: string,
    interval: PriceChangeInterval = '1d',
    limit = 100
  ): Promise<AssetPriceHistory[]> {
    const supabase = await createClient()
    
    // Calculate date range based on interval
    const endDate = new Date()
    const startDate = new Date()
    
    switch (interval) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1)
        break
      case '1w':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '1m':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case '6m':
        startDate.setMonth(startDate.getMonth() - 6)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      case '5y':
        startDate.setFullYear(startDate.getFullYear() - 5)
        break
    }
    
    const { data: history, error } = await supabase
      .from('asset_price_history')
      .select('*')
      .eq('asset_id', assetId)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return history || []
  }
  
  static async getMarketData(): Promise<MarketData> {
    const supabase = await createClient()
    
    // Get market indexes
    const { data: indexes } = await supabase
      .from('market_indexes')
      .select('*')
      .in('symbol', ['SPY', 'DIA', 'QQQ', 'IWM'])
    
    // Get trending assets (most volume in last 24h)
    const { data: trending } = await supabase
      .from('assets')
      .select('*')
      .order('volume_24h', { ascending: false })
      .limit(10)
    
    // Get top gainers
    const { data: gainers } = await supabase
      .from('assets')
      .select('*')
      .gt('price_change_percentage_24h', 0)
      .order('price_change_percentage_24h', { ascending: false })
      .limit(10)
    
    // Get top losers
    const { data: losers } = await supabase
      .from('assets')
      .select('*')
      .lt('price_change_percentage_24h', 0)
      .order('price_change_percentage_24h', { ascending: true })
      .limit(10)
    
    // Get most active (by transaction count)
    const { data: mostActive } = await supabase
      .from('assets')
      .select('*')
      .order('transaction_count_24h', { ascending: false })
      .limit(10)
    
    const now = new Date()
    const marketStatus = this.getMarketStatus(now)
    
    return {
      status: marketStatus,
      indexes: indexes || [],
      trending: trending?.map(a => this.calculatePriceMetrics(a)) || [],
      gainers: gainers?.map(a => this.calculatePriceMetrics(a)) || [],
      losers: losers?.map(a => this.calculatePriceMetrics(a)) || [],
      most_active: mostActive?.map(a => this.calculatePriceMetrics(a)) || [],
      timestamp: now.toISOString(),
    }
  }
  
  static async updateAssetPrices(assets: Array<{
    symbol: string
    price: number
    volume?: number
  }>): Promise<void> {
    const supabase = await createClient()
    
    // Batch update asset prices
    for (const asset of assets) {
      const { data: currentAsset } = await supabase
        .from('assets')
        .select('id, current_price, high_24h, low_24h')
        .eq('symbol', asset.symbol)
        .single()
      
      if (currentAsset) {
        const updates: any = {
          previous_close: currentAsset.current_price,
          current_price: asset.price,
          last_updated: new Date().toISOString(),
        }
        
        // Update 24h high/low
        if (asset.price > (currentAsset.high_24h || 0)) {
          updates.high_24h = asset.price
        }
        if (asset.price < (currentAsset.low_24h || Number.MAX_VALUE)) {
          updates.low_24h = asset.price
        }
        
        if (asset.volume) {
          updates.volume = asset.volume
        }
        
        await supabase
          .from('assets')
          .update(updates)
          .eq('symbol', asset.symbol)
        
        // Store in price history
        await supabase
          .from('asset_price_history')
          .insert({
            asset_id: currentAsset.id,
            timestamp: new Date().toISOString(),
            open: currentAsset.current_price,
            high: Math.max(currentAsset.current_price, asset.price),
            low: Math.min(currentAsset.current_price, asset.price),
            close: asset.price,
            volume: asset.volume || 0,
          })
      }
    }
  }
  
  static async getAssetsByIds(assetIds: string[]): Promise<Asset[]> {
    const supabase = await createClient()
    
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .in('id', assetIds)
    
    if (error) throw error
    
    return assets?.map(a => this.calculatePriceMetrics(a)) || []
  }
  
  static async getSectorPerformance(): Promise<Array<{
    sector: string
    performance: number
    volume: number
    marketCap: number
  }>> {
    const supabase = await createClient()
    
    const { data: sectors, error } = await supabase
      .from('assets')
      .select('sector, price_change_percentage_24h, volume_24h, market_cap')
      .not('sector', 'is', null)
    
    if (error) throw error
    
    // Aggregate by sector
    const sectorMap = new Map<string, {
      totalPerformance: number
      totalVolume: number
      totalMarketCap: number
      count: number
    }>()
    
    sectors?.forEach(asset => {
      const current = sectorMap.get(asset.sector) || {
        totalPerformance: 0,
        totalVolume: 0,
        totalMarketCap: 0,
        count: 0,
      }
      
      sectorMap.set(asset.sector, {
        totalPerformance: current.totalPerformance + (asset.price_change_percentage_24h || 0),
        totalVolume: current.totalVolume + (asset.volume_24h || 0),
        totalMarketCap: current.totalMarketCap + (asset.market_cap || 0),
        count: current.count + 1,
      })
    })
    
    return Array.from(sectorMap.entries()).map(([sector, data]) => ({
      sector,
      performance: data.totalPerformance / data.count,
      volume: data.totalVolume,
      marketCap: data.totalMarketCap,
    }))
  }
  
  private static calculatePriceMetrics(asset: any): Asset {
    const priceChange = asset.current_price - (asset.previous_close || asset.current_price)
    const priceChangePercentage = asset.previous_close
      ? (priceChange / asset.previous_close) * 100
      : 0
    
    return {
      ...asset,
      price_change: priceChange,
      price_change_percentage: priceChangePercentage,
    }
  }
  
  private static getMarketStatus(date: Date): MarketStatus {
    const hours = date.getUTCHours()
    const day = date.getUTCDay()
    
    // Weekend - market closed
    if (day === 0 || day === 6) {
      return 'closed'
    }
    
    // Convert UTC to EST (UTC-5)
    const estHours = (hours - 5 + 24) % 24
    
    // Pre-market: 4:00 AM - 9:30 AM EST
    if (estHours >= 4 && estHours < 9.5) {
      return 'pre_market'
    }
    
    // Market hours: 9:30 AM - 4:00 PM EST
    if (estHours >= 9.5 && estHours < 16) {
      return 'open'
    }
    
    // After hours: 4:00 PM - 8:00 PM EST
    if (estHours >= 16 && estHours < 20) {
      return 'after_hours'
    }
    
    return 'closed'
  }
}