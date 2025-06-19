import { createClient } from '@/lib/supabase/server'

import { PortfolioService } from '../portfolio/portfolio.service'

import { TransactionService } from './transaction.service'

export type InvestmentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'
export type InvestmentTrigger = 'schedule' | 'round_up' | 'goal_based' | 'market_dip'
export type AllocationStrategy = 'equal_weight' | 'market_cap' | 'esg_weighted' | 'custom'

export interface AutomationRule {
  id: string
  user_id: string
  portfolio_id: string
  name: string
  is_active: boolean
  investment_amount: number
  frequency: InvestmentFrequency
  trigger_type: InvestmentTrigger
  allocation_strategy: AllocationStrategy
  asset_allocation: Record<string, number> // asset_id -> percentage
  round_up_multiplier?: number
  market_dip_threshold?: number
  next_execution: string
  last_execution?: string
  total_invested: number
  execution_count: number
  created_at: string
  updated_at: string
}

export interface RoundUpTransaction {
  transaction_id: string
  amount: number
  rounded_amount: number
  round_up_amount: number
  merchant: string
  date: string
}

export interface InvestmentExecution {
  automation_rule_id: string
  portfolio_id: string
  total_amount: number
  allocations: Array<{
    asset_id: string
    symbol: string
    amount: number
    quantity: number
    price: number
  }>
  executed_at: string
  status: 'success' | 'failed' | 'partial'
  error?: string
}

export class AutomationService {
  static async createAutomationRule(
    userId: string,
    data: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at' | 'total_invested' | 'execution_count' | 'user_id'>
  ): Promise<AutomationRule> {
    const supabase = await createClient()
    
    // Calculate next execution date
    const nextExecution = this.calculateNextExecution(data.frequency, data.trigger_type)
    
    const { data: rule, error } = await supabase
      .from('automation_rules')
      .insert({
        user_id: userId,
        ...data,
        next_execution: nextExecution,
        total_invested: 0,
        execution_count: 0,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return rule
  }
  
  static async getAutomationRules(userId: string): Promise<AutomationRule[]> {
    const supabase = await createClient()
    
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return rules || []
  }
  
  static async updateAutomationRule(
    userId: string,
    ruleId: string,
    updates: Partial<AutomationRule>
  ): Promise<AutomationRule> {
    const supabase = await createClient()
    
    // If frequency is updated, recalculate next execution
    if (updates.frequency || updates.trigger_type) {
      const { data: currentRule } = await supabase
        .from('automation_rules')
        .select('frequency, trigger_type')
        .eq('id', ruleId)
        .single()
      
      const frequency = updates.frequency || currentRule?.frequency
      const triggerType = updates.trigger_type || currentRule?.trigger_type
      
      if (frequency && triggerType) {
        updates.next_execution = this.calculateNextExecution(frequency, triggerType)
      }
    }
    
    const { data: rule, error } = await supabase
      .from('automation_rules')
      .update(updates)
      .eq('id', ruleId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    
    return rule
  }
  
  static async deleteAutomationRule(userId: string, ruleId: string): Promise<void> {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', ruleId)
      .eq('user_id', userId)
    
    if (error) throw error
  }
  
  static async executeScheduledInvestments(): Promise<InvestmentExecution[]> {
    const supabase = await createClient()
    
    // Get all active rules due for execution
    const { data: dueRules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'schedule')
      .lte('next_execution', new Date().toISOString())
    
    if (error) throw error
    
    const executions: InvestmentExecution[] = []
    
    for (const rule of dueRules || []) {
      try {
        const execution = await this.executeInvestment(rule)
        executions.push(execution)
        
        // Update rule with next execution date
        await supabase
          .from('automation_rules')
          .update({
            last_execution: new Date().toISOString(),
            next_execution: this.calculateNextExecution(rule.frequency, rule.trigger_type),
            total_invested: rule.total_invested + execution.total_amount,
            execution_count: rule.execution_count + 1,
          })
          .eq('id', rule.id)
      } catch (error) {
        console.error(`Failed to execute automation rule ${rule.id}:`, error)
        executions.push({
          automation_rule_id: rule.id,
          portfolio_id: rule.portfolio_id,
          total_amount: 0,
          allocations: [],
          executed_at: new Date().toISOString(),
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
    
    return executions
  }
  
  static async processRoundUp(
    userId: string,
    transaction: RoundUpTransaction
  ): Promise<InvestmentExecution | null> {
    const supabase = await createClient()
    
    // Get active round-up rules
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('trigger_type', 'round_up')
    
    if (error || !rules || rules.length === 0) return null
    
    const rule = rules[0] // Use first active round-up rule
    
    // Calculate round-up amount
    const roundUpAmount = transaction.round_up_amount * (rule.round_up_multiplier || 1)
    
    // Store round-up for batching
    await supabase
      .from('round_up_accumulator')
      .insert({
        user_id: userId,
        automation_rule_id: rule.id,
        transaction_id: transaction.transaction_id,
        amount: roundUpAmount,
        created_at: new Date().toISOString(),
      })
    
    // Check if accumulated amount exceeds threshold
    const { data: accumulated } = await supabase
      .from('round_up_accumulator')
      .select('amount')
      .eq('automation_rule_id', rule.id)
      .eq('is_invested', false)
    
    const totalAccumulated = accumulated?.reduce((sum, item) => sum + item.amount, 0) || 0
    
    // Execute investment if threshold reached (e.g., $5)
    if (totalAccumulated >= 5) {
      const execution = await this.executeInvestment({
        ...rule,
        investment_amount: totalAccumulated,
      })
      
      // Mark round-ups as invested
      await supabase
        .from('round_up_accumulator')
        .update({ is_invested: true })
        .eq('automation_rule_id', rule.id)
        .eq('is_invested', false)
      
      return execution
    }
    
    return null
  }
  
  static async checkMarketDipTriggers(): Promise<InvestmentExecution[]> {
    const supabase = await createClient()
    
    // Get market dip rules
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'market_dip')
    
    if (error || !rules) return []
    
    const executions: InvestmentExecution[] = []
    
    for (const rule of rules) {
      // Check if market has dipped by threshold
      const marketDip = await this.checkMarketDip(rule.asset_allocation, rule.market_dip_threshold || 5)
      
      if (marketDip) {
        try {
          const execution = await this.executeInvestment(rule)
          executions.push(execution)
          
          // Update last execution to prevent repeated triggers
          await supabase
            .from('automation_rules')
            .update({
              last_execution: new Date().toISOString(),
              total_invested: rule.total_invested + execution.total_amount,
              execution_count: rule.execution_count + 1,
            })
            .eq('id', rule.id)
        } catch (error) {
          console.error(`Failed to execute market dip rule ${rule.id}:`, error)
        }
      }
    }
    
    return executions
  }
  
  private static async executeInvestment(rule: AutomationRule): Promise<InvestmentExecution> {
    const supabase = await createClient()
    
    // Get current asset prices
    const assetIds = Object.keys(rule.asset_allocation)
    const { data: assets, error } = await supabase
      .from('assets')
      .select('id, symbol, current_price')
      .in('id', assetIds)
    
    if (error || !assets) throw new Error('Failed to fetch asset prices')
    
    const allocations = []
    let totalAllocated = 0
    
    // Calculate allocations based on strategy
    for (const asset of assets) {
      const allocationPercentage = rule.asset_allocation[asset.id] || 0
      const amount = (rule.investment_amount * allocationPercentage) / 100
      const quantity = amount / asset.current_price
      
      if (quantity > 0) {
        allocations.push({
          asset_id: asset.id,
          symbol: asset.symbol,
          amount,
          quantity,
          price: asset.current_price,
        })
        totalAllocated += amount
      }
    }
    
    // Execute transactions
    for (const allocation of allocations) {
      await TransactionService.createTransaction({
        portfolio_id: rule.portfolio_id,
        asset_id: allocation.asset_id,
        type: 'buy',
        quantity: allocation.quantity,
        price: allocation.price,
        total_amount: allocation.amount,
        automation_rule_id: rule.id,
      })
    }
    
    // Update portfolio calculations
    await PortfolioService.calculateReturns(rule.portfolio_id)
    
    return {
      automation_rule_id: rule.id,
      portfolio_id: rule.portfolio_id,
      total_amount: totalAllocated,
      allocations,
      executed_at: new Date().toISOString(),
      status: 'success',
    }
  }
  
  private static calculateNextExecution(
    frequency: InvestmentFrequency,
    triggerType: InvestmentTrigger
  ): string {
    if (triggerType !== 'schedule') {
      return new Date().toISOString() // Non-scheduled triggers don't have fixed next execution
    }
    
    const now = new Date()
    
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1)
        break
      case 'weekly':
        now.setDate(now.getDate() + 7)
        break
      case 'biweekly':
        now.setDate(now.getDate() + 14)
        break
      case 'monthly':
        now.setMonth(now.getMonth() + 1)
        break
    }
    
    return now.toISOString()
  }
  
  private static async checkMarketDip(
    assetAllocation: Record<string, number>,
    threshold: number
  ): Promise<boolean> {
    const supabase = await createClient()
    
    // Get assets and their price history
    const assetIds = Object.keys(assetAllocation)
    const { data: assets } = await supabase
      .from('assets')
      .select('id, current_price, previous_close')
      .in('id', assetIds)
    
    if (!assets) return false
    
    // Check if any asset has dipped by threshold
    for (const asset of assets) {
      if (asset.previous_close && asset.current_price) {
        const dipPercentage = ((asset.previous_close - asset.current_price) / asset.previous_close) * 100
        if (dipPercentage >= threshold) {
          return true
        }
      }
    }
    
    return false
  }
}