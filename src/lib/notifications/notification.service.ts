import { createClient } from '@/lib/supabase/server'
import { RealtimeService } from '@/lib/realtime/realtime.service'

export type NotificationType = 
  | 'transaction'
  | 'achievement' 
  | 'price_alert'
  | 'portfolio_update'
  | 'risk_alert'
  | 'system'
  | 'marketing'
  | 'education'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface NotificationTemplate {
  id: string
  name: string
  type: NotificationType
  titleTemplate: string
  messageTemplate: string
  actionUrl?: string
  priority: NotificationPriority
  channels: NotificationChannel[]
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  metadata?: Record<string, any>
  actionUrl?: string
  isRead: boolean
  readAt?: string
  channels: NotificationChannel[]
  createdAt: string
}

export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms'

export interface NotificationPreferences {
  userId: string
  channels: {
    in_app: boolean
    email: boolean
    push: boolean
    sms: boolean
  }
  types: {
    transaction: boolean
    achievement: boolean
    price_alert: boolean
    portfolio_update: boolean
    risk_alert: boolean
    system: boolean
    marketing: boolean
    education: boolean
  }
  quietHours: {
    enabled: boolean
    start: string // HH:MM format
    end: string // HH:MM format
    timezone: string
  }
  frequency: {
    realtime: boolean
    digest: 'none' | 'daily' | 'weekly'
    digestTime: string // HH:MM format
  }
}

export interface PriceAlert {
  id: string
  userId: string
  assetId: string
  alertType: 'above' | 'below' | 'change_percent'
  threshold: number
  isActive: boolean
  lastTriggered?: string
  createdAt: string
}

export interface NotificationStats {
  total: number
  unread: number
  byType: Record<NotificationType, number>
  byPriority: Record<NotificationPriority, number>
  lastNotificationAt?: string
}

export class NotificationService {
  static async createNotification(
    userId: string,
    data: {
      type: NotificationType
      title: string
      message: string
      priority?: NotificationPriority
      metadata?: Record<string, any>
      actionUrl?: string
      channels?: NotificationChannel[]
    }
  ): Promise<Notification> {
    const supabase = await createClient()
    
    // Get user preferences
    const preferences = await this.getUserPreferences(userId)
    
    // Determine channels based on preferences
    const channels = data.channels || this.determineChannels(data.type, data.priority || 'medium', preferences)
    
    // Check quiet hours
    if (this.isInQuietHours(preferences) && data.priority !== 'urgent') {
      // Queue for later delivery
      await this.queueNotification(userId, data, preferences.quietHours.end)
      throw new Error('Notification queued for delivery after quiet hours')
    }
    
    // Create notification in database
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'medium',
        metadata: data.metadata || {},
        action_url: data.actionUrl,
        channels,
        is_read: false,
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Send through appropriate channels
    await this.sendThroughChannels(notification, channels)
    
    // Broadcast real-time update
    const realtime = RealtimeService.getInstance()
    await realtime.broadcast('notification.created', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      metadata: notification.metadata,
    }, userId)
    
    return this.formatNotification(notification)
  }
  
  static async createBulkNotifications(
    userIds: string[],
    template: {
      type: NotificationType
      titleTemplate: string
      messageTemplate: string
      priority?: NotificationPriority
      metadata?: Record<string, any>
    }
  ): Promise<number> {
    const supabase = await createClient()
    
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: template.type,
      title: this.renderTemplate(template.titleTemplate, template.metadata || {}),
      message: this.renderTemplate(template.messageTemplate, template.metadata || {}),
      priority: template.priority || 'medium',
      metadata: template.metadata || {},
      is_read: false,
      channels: ['in_app'],
    }))
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
    
    if (error) throw error
    
    return data?.length || 0
  }
  
  static async getNotifications(
    userId: string,
    filters?: {
      type?: NotificationType
      isRead?: boolean
      priority?: NotificationPriority
      startDate?: string
      endDate?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    const supabase = await createClient()
    
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
    
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    
    if (filters?.isRead !== undefined) {
      query = query.eq('is_read', filters.isRead)
    }
    
    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }
    
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }
    
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }
    
    query = query.order('created_at', { ascending: false })
    
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }
    
    const { data: notifications, error, count } = await query
    
    if (error) throw error
    
    return {
      notifications: notifications?.map(n => this.formatNotification(n)) || [],
      total: count || 0,
    }
  }
  
  static async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .in('id', notificationIds)
    
    if (error) throw error
  }
  
  static async markAllAsRead(userId: string): Promise<void> {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false)
    
    if (error) throw error
  }
  
  static async deleteNotifications(userId: string, notificationIds: string[]): Promise<void> {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .in('id', notificationIds)
    
    if (error) throw error
  }
  
  static async getNotificationStats(userId: string): Promise<NotificationStats> {
    const supabase = await createClient()
    
    // Get all notifications for stats
    const { data: notifications } = await supabase
      .from('notifications')
      .select('type, priority, is_read, created_at')
      .eq('user_id', userId)
    
    if (!notifications) {
      return {
        total: 0,
        unread: 0,
        byType: {} as Record<NotificationType, number>,
        byPriority: {} as Record<NotificationPriority, number>,
      }
    }
    
    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      lastNotificationAt: notifications[0]?.created_at,
    }
    
    // Count by type
    notifications.forEach(n => {
      stats.byType[n.type as NotificationType] = (stats.byType[n.type as NotificationType] || 0) + 1
      stats.byPriority[n.priority as NotificationPriority] = (stats.byPriority[n.priority as NotificationPriority] || 0) + 1
    })
    
    return stats
  }
  
  // Notification Preferences
  static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const supabase = await createClient()
    
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (!preferences) {
      // Return default preferences
      return {
        userId,
        channels: {
          in_app: true,
          email: true,
          push: true,
          sms: false,
        },
        types: {
          transaction: true,
          achievement: true,
          price_alert: true,
          portfolio_update: true,
          risk_alert: true,
          system: true,
          marketing: false,
          education: true,
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
          timezone: 'America/New_York',
        },
        frequency: {
          realtime: true,
          digest: 'none',
          digestTime: '09:00',
        },
      }
    }
    
    return this.formatPreferences(preferences)
  }
  
  static async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return this.formatPreferences(data)
  }
  
  // Price Alerts
  static async createPriceAlert(
    userId: string,
    alert: {
      assetId: string
      alertType: 'above' | 'below' | 'change_percent'
      threshold: number
    }
  ): Promise<PriceAlert> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: userId,
        asset_id: alert.assetId,
        alert_type: alert.alertType,
        threshold: alert.threshold,
        is_active: true,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return data
  }
  
  static async getPriceAlerts(userId: string, activeOnly = true): Promise<PriceAlert[]> {
    const supabase = await createClient()
    
    let query = supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
    
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data || []
  }
  
  static async updatePriceAlert(
    userId: string,
    alertId: string,
    updates: Partial<PriceAlert>
  ): Promise<PriceAlert> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('price_alerts')
      .update(updates)
      .eq('id', alertId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    
    return data
  }
  
  static async checkPriceAlerts(): Promise<void> {
    const supabase = await createClient()
    
    // Get all active price alerts
    const { data: alerts } = await supabase
      .from('price_alerts')
      .select(`
        *,
        asset:assets(
          symbol,
          name,
          current_price,
          price_change_percentage_24h
        )
      `)
      .eq('is_active', true)
    
    if (!alerts) return
    
    for (const alert of alerts) {
      const triggered = this.checkAlertCondition(alert)
      
      if (triggered) {
        // Create notification
        await this.createNotification(alert.user_id, {
          type: 'price_alert',
          title: `Price Alert: ${alert.asset.symbol}`,
          message: this.generateAlertMessage(alert),
          priority: 'high',
          metadata: {
            alertId: alert.id,
            assetId: alert.asset_id,
            symbol: alert.asset.symbol,
            currentPrice: alert.asset.current_price,
            threshold: alert.threshold,
          },
          actionUrl: `/assets/${alert.asset_id}`,
        })
        
        // Update last triggered time
        await supabase
          .from('price_alerts')
          .update({ last_triggered: new Date().toISOString() })
          .eq('id', alert.id)
      }
    }
  }
  
  // Notification Templates
  static async sendTransactionNotification(
    userId: string,
    transaction: {
      type: 'buy' | 'sell'
      symbol: string
      quantity: number
      price: number
      total: number
    }
  ): Promise<void> {
    const action = transaction.type === 'buy' ? 'purchased' : 'sold'
    
    await this.createNotification(userId, {
      type: 'transaction',
      title: `Transaction Complete`,
      message: `You ${action} ${transaction.quantity} shares of ${transaction.symbol} at $${transaction.price.toFixed(2)} per share. Total: $${transaction.total.toFixed(2)}`,
      priority: 'medium',
      metadata: transaction,
      actionUrl: `/transactions`,
    })
  }
  
  static async sendAchievementNotification(
    userId: string,
    achievement: {
      name: string
      description: string
      points: number
      icon: string
    }
  ): Promise<void> {
    await this.createNotification(userId, {
      type: 'achievement',
      title: `Achievement Unlocked! ${achievement.icon}`,
      message: `You've earned "${achievement.name}" - ${achievement.description}. +${achievement.points} points!`,
      priority: 'medium',
      metadata: achievement,
      actionUrl: `/achievements`,
    })
  }
  
  static async sendRiskAlertNotification(
    userId: string,
    alert: {
      severity: 'warning' | 'critical'
      title: string
      description: string
      action?: string
    }
  ): Promise<void> {
    await this.createNotification(userId, {
      type: 'risk_alert',
      title: alert.title,
      message: alert.description,
      priority: alert.severity === 'critical' ? 'urgent' : 'high',
      metadata: alert,
      actionUrl: `/portfolio/risk`,
    })
  }
  
  static async sendDigestNotification(userId: string, period: 'daily' | 'weekly'): Promise<void> {
    const supabase = await createClient()
    
    // Get portfolio summary
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (!portfolios || portfolios.length === 0) return
    
    const portfolio = portfolios[0]
    const periodLabel = period === 'daily' ? 'Daily' : 'Weekly'
    
    await this.createNotification(userId, {
      type: 'portfolio_update',
      title: `Your ${periodLabel} Portfolio Summary`,
      message: `Portfolio value: $${portfolio.total_value.toFixed(2)} | Returns: ${portfolio.total_returns >= 0 ? '+' : ''}$${portfolio.total_returns.toFixed(2)} (${((portfolio.total_returns / portfolio.total_invested) * 100).toFixed(2)}%)`,
      priority: 'low',
      metadata: {
        portfolioId: portfolio.id,
        period,
      },
      actionUrl: `/portfolio/${portfolio.id}`,
    })
  }
  
  // Helper methods
  private static formatNotification(notification: any): Notification {
    return {
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      metadata: notification.metadata,
      actionUrl: notification.action_url,
      isRead: notification.is_read,
      readAt: notification.read_at,
      channels: notification.channels || ['in_app'],
      createdAt: notification.created_at,
    }
  }
  
  private static formatPreferences(prefs: any): NotificationPreferences {
    return {
      userId: prefs.user_id,
      channels: prefs.channels || {},
      types: prefs.types || {},
      quietHours: prefs.quiet_hours || {},
      frequency: prefs.frequency || {},
    }
  }
  
  private static renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match
    })
  }
  
  private static determineChannels(
    type: NotificationType,
    priority: NotificationPriority,
    preferences: NotificationPreferences
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = ['in_app']
    
    // Always include in-app
    if (!preferences.types[type]) {
      return channels
    }
    
    // Add other channels based on priority and preferences
    if (priority === 'urgent' || priority === 'high') {
      if (preferences.channels.push) channels.push('push')
      if (preferences.channels.email) channels.push('email')
      if (priority === 'urgent' && preferences.channels.sms) channels.push('sms')
    } else if (priority === 'medium') {
      if (preferences.channels.push) channels.push('push')
    }
    
    return channels
  }
  
  private static isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) return false
    
    const now = new Date()
    const _timezone = preferences.quietHours.timezone || 'UTC'
    
    // Convert to user's timezone and check
    // Simplified implementation - would use proper timezone library in production
    const hour = now.getHours()
    const startHour = parseInt(preferences.quietHours.start.split(':')[0])
    const endHour = parseInt(preferences.quietHours.end.split(':')[0])
    
    if (startHour > endHour) {
      // Quiet hours span midnight
      return hour >= startHour || hour < endHour
    } else {
      return hour >= startHour && hour < endHour
    }
  }
  
  private static async queueNotification(
    userId: string,
    notification: any,
    deliveryTime: string
  ): Promise<void> {
    const supabase = await createClient()
    
    await supabase
      .from('notification_queue')
      .insert({
        user_id: userId,
        notification_data: notification,
        scheduled_for: deliveryTime,
      })
  }
  
  private static async sendThroughChannels(
    _notification: any,
    channels: NotificationChannel[]
  ): Promise<void> {
    for (const channel of channels) {
      switch (channel) {
        case 'email':
          // await this.sendEmail(notification)
          break
        case 'push':
          // await this.sendPushNotification(notification)
          break
        case 'sms':
          // await this.sendSMS(notification)
          break
        case 'in_app':
          // Already handled by database insert
          break
      }
    }
  }
  
  private static checkAlertCondition(alert: any): boolean {
    const currentPrice = alert.asset.current_price
    
    switch (alert.alert_type) {
      case 'above':
        return currentPrice >= alert.threshold
      case 'below':
        return currentPrice <= alert.threshold
      case 'change_percent':
        return Math.abs(alert.asset.price_change_percentage_24h) >= alert.threshold
      default:
        return false
    }
  }
  
  private static generateAlertMessage(alert: any): string {
    const { asset, alert_type, threshold } = alert
    
    switch (alert_type) {
      case 'above':
        return `${asset.name} (${asset.symbol}) has reached $${asset.current_price.toFixed(2)}, above your alert threshold of $${threshold.toFixed(2)}`
      case 'below':
        return `${asset.name} (${asset.symbol}) has dropped to $${asset.current_price.toFixed(2)}, below your alert threshold of $${threshold.toFixed(2)}`
      case 'change_percent':
        return `${asset.name} (${asset.symbol}) has moved ${asset.price_change_percentage_24h.toFixed(2)}% in the last 24 hours`
      default:
        return 'Price alert triggered'
    }
  }
}