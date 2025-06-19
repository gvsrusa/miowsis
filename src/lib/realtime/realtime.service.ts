import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type RealtimeEvent = 
  | 'portfolio.update'
  | 'asset.price_update'
  | 'transaction.created'
  | 'transaction.completed'
  | 'holding.update'
  | 'achievement.unlocked'
  | 'notification.created'
  | 'market.status_change'

export interface RealtimeMessage<T = any> {
  event: RealtimeEvent
  payload: T
  timestamp: string
  userId?: string
}

export interface PriceUpdate {
  assetId: string
  symbol: string
  price: number
  previousPrice: number
  change: number
  changePercentage: number
  volume: number
  timestamp: string
}

export interface PortfolioUpdate {
  portfolioId: string
  totalValue: number
  totalReturns: number
  dayChange: number
  dayChangePercentage: number
}

export interface TransactionUpdate {
  transactionId: string
  status: string
  executedAt?: string
  error?: string
}

export interface NotificationPayload {
  id: string
  title: string
  message: string
  type: string
  metadata?: any
}

type RealtimeCallback<T = any> = (message: RealtimeMessage<T>) => void

export class RealtimeService {
  private static instance: RealtimeService
  private supabase: ReturnType<typeof createClient>
  private channels: Map<string, RealtimeChannel> = new Map()
  private subscriptions: Map<string, Set<RealtimeCallback>> = new Map()
  private priceUpdateInterval?: NodeJS.Timeout
  
  private constructor() {
    this.supabase = createClient()
  }
  
  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService()
    }
    return RealtimeService.instance
  }
  
  // Subscribe to portfolio updates
  subscribeToPortfolio(portfolioId: string, callback: RealtimeCallback<PortfolioUpdate>): () => void {
    const channelName = `portfolio:${portfolioId}`
    
    if (!this.channels.has(channelName)) {
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'portfolios',
            filter: `id=eq.${portfolioId}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handlePortfolioChange(portfolioId, payload)
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'holdings',
            filter: `portfolio_id=eq.${portfolioId}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleHoldingChange(portfolioId, payload)
          }
        )
        .subscribe()
      
      this.channels.set(channelName, channel)
    }
    
    return this.addSubscription(channelName, callback)
  }
  
  // Subscribe to asset price updates
  subscribeToAssetPrices(assetIds: string[], callback: RealtimeCallback<PriceUpdate>): () => void {
    const channelName = `assets:${assetIds.join(',')}`
    
    if (!this.channels.has(channelName)) {
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'assets',
            filter: `id=in.(${assetIds.join(',')})`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleAssetPriceChange(payload)
          }
        )
        .subscribe()
      
      this.channels.set(channelName, channel)
    }
    
    return this.addSubscription(channelName, callback)
  }
  
  // Subscribe to user transactions
  subscribeToTransactions(userId: string, callback: RealtimeCallback<TransactionUpdate>): () => void {
    const channelName = `transactions:${userId}`
    
    if (!this.channels.has(channelName)) {
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleTransactionChange(payload)
          }
        )
        .subscribe()
      
      this.channels.set(channelName, channel)
    }
    
    return this.addSubscription(channelName, callback)
  }
  
  // Subscribe to notifications
  subscribeToNotifications(userId: string, callback: RealtimeCallback<NotificationPayload>): () => void {
    const channelName = `notifications:${userId}`
    
    if (!this.channels.has(channelName)) {
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleNotificationChange(payload)
          }
        )
        .subscribe()
      
      this.channels.set(channelName, channel)
    }
    
    return this.addSubscription(channelName, callback)
  }
  
  // Subscribe to achievement unlocks
  subscribeToAchievements(userId: string, callback: RealtimeCallback<any>): () => void {
    const channelName = `achievements:${userId}`
    
    if (!this.channels.has(channelName)) {
      const channel = this.supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_achievements',
            filter: `user_id=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleAchievementUnlock(payload)
          }
        )
        .subscribe()
      
      this.channels.set(channelName, channel)
    }
    
    return this.addSubscription(channelName, callback)
  }
  
  // Broadcast custom events
  async broadcast(event: RealtimeEvent, payload: any, userId?: string): Promise<void> {
    const message: RealtimeMessage = {
      event,
      payload,
      timestamp: new Date().toISOString(),
      userId,
    }
    
    // Find relevant subscribers and notify them
    this.subscriptions.forEach((callbacks, channelName) => {
      // Match channel patterns
      if (this.shouldNotifyChannel(channelName, event, userId)) {
        callbacks.forEach(callback => callback(message))
      }
    })
  }
  
  // Start simulated price updates (for demo/testing)
  startPriceSimulation(assetIds: string[], intervalMs = 5000): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval)
    }
    
    this.priceUpdateInterval = setInterval(async () => {
      for (const assetId of assetIds) {
        // Simulate price change (-2% to +2%)
        const changePercent = (Math.random() - 0.5) * 4
        const previousPrice = 100 // Would fetch from DB in real scenario
        const newPrice = previousPrice * (1 + changePercent / 100)
        
        const priceUpdate: PriceUpdate = {
          assetId,
          symbol: 'DEMO',
          price: newPrice,
          previousPrice,
          change: newPrice - previousPrice,
          changePercentage: changePercent,
          volume: Math.floor(Math.random() * 1000000),
          timestamp: new Date().toISOString(),
        }
        
        await this.broadcast('asset.price_update', priceUpdate)
      }
    }, intervalMs)
  }
  
  stopPriceSimulation(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval)
      this.priceUpdateInterval = undefined
    }
  }
  
  // Clean up specific subscription
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName)
    if (channel) {
      channel.unsubscribe()
      this.channels.delete(channelName)
      this.subscriptions.delete(channelName)
    }
  }
  
  // Clean up all subscriptions
  unsubscribeAll(): void {
    this.stopPriceSimulation()
    
    this.channels.forEach((channel, _name) => {
      channel.unsubscribe()
    })
    
    this.channels.clear()
    this.subscriptions.clear()
  }
  
  private addSubscription(channelName: string, callback: RealtimeCallback): () => void {
    if (!this.subscriptions.has(channelName)) {
      this.subscriptions.set(channelName, new Set())
    }
    
    this.subscriptions.get(channelName)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(channelName)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.unsubscribe(channelName)
        }
      }
    }
  }
  
  private handlePortfolioChange(portfolioId: string, payload: RealtimePostgresChangesPayload<any>): void {
    const data = payload.new || payload.old
    if (!data) return
    
    const update: PortfolioUpdate = {
      portfolioId,
      totalValue: data.total_value || 0,
      totalReturns: data.total_returns || 0,
      dayChange: data.day_change || 0,
      dayChangePercentage: data.day_change_percentage || 0,
    }
    
    this.broadcast('portfolio.update', update)
  }
  
  private handleHoldingChange(portfolioId: string, payload: RealtimePostgresChangesPayload<any>): void {
    // Trigger portfolio recalculation
    this.broadcast('holding.update', {
      portfolioId,
      holdingId: (payload.new as any)?.id || (payload.old as any)?.id,
      changeType: payload.eventType,
    })
  }
  
  private handleAssetPriceChange(payload: RealtimePostgresChangesPayload<any>): void {
    const newData = payload.new
    const oldData = payload.old
    
    if (!newData || !oldData) return
    
    const priceUpdate: PriceUpdate = {
      assetId: (newData as any).id,
      symbol: (newData as any).symbol,
      price: (newData as any).current_price,
      previousPrice: (oldData as any).current_price,
      change: (newData as any).current_price - (oldData as any).current_price,
      changePercentage: (((newData as any).current_price - (oldData as any).current_price) / (oldData as any).current_price) * 100,
      volume: (newData as any).volume || 0,
      timestamp: new Date().toISOString(),
    }
    
    this.broadcast('asset.price_update', priceUpdate)
  }
  
  private handleTransactionChange(payload: RealtimePostgresChangesPayload<any>): void {
    const data = payload.new || payload.old
    if (!data) return
    
    const update: TransactionUpdate = {
      transactionId: data.id,
      status: data.status,
      executedAt: data.executed_at,
      error: data.error,
    }
    
    const event = payload.eventType === 'INSERT' 
      ? 'transaction.created' 
      : 'transaction.completed'
    
    this.broadcast(event, update, data.user_id)
  }
  
  private handleNotificationChange(payload: RealtimePostgresChangesPayload<any>): void {
    const data = payload.new
    if (!data) return
    
    const notification: NotificationPayload = {
      id: data.id,
      title: data.title,
      message: data.message,
      type: data.type,
      metadata: data.metadata,
    }
    
    this.broadcast('notification.created', notification, data.user_id)
  }
  
  private handleAchievementUnlock(payload: RealtimePostgresChangesPayload<any>): void {
    const data = payload.new
    if (!data) return
    
    this.broadcast('achievement.unlocked', {
      achievementId: data.achievement_id,
      userId: data.user_id,
      unlockedAt: data.unlocked_at,
    }, data.user_id)
  }
  
  private shouldNotifyChannel(channelName: string, event: RealtimeEvent, userId?: string): boolean {
    // Parse channel name to determine if it should receive the event
    const [type, id] = channelName.split(':')
    
    switch (event) {
      case 'portfolio.update':
      case 'holding.update':
        return type === 'portfolio'
      
      case 'asset.price_update':
        return type === 'assets'
      
      case 'transaction.created':
      case 'transaction.completed':
        return type === 'transactions' && id === userId
      
      case 'notification.created':
        return type === 'notifications' && id === userId
      
      case 'achievement.unlocked':
        return type === 'achievements' && id === userId
      
      default:
        return false
    }
  }
}