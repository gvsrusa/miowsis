import { createClient } from '@/lib/supabase/server'

export type TransactionType = 'buy' | 'sell' | 'dividend' | 'fee'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export interface CreateTransactionData {
  portfolio_id: string
  asset_id: string
  type: TransactionType
  quantity: number
  price: number
  total_amount: number
  automation_rule_id?: string
  notes?: string
}

export interface Transaction {
  id: string
  portfolio_id: string
  asset_id: string
  type: TransactionType
  quantity: number
  price: number
  total_amount: number
  fee: number
  status: TransactionStatus
  automation_rule_id?: string
  notes?: string
  executed_at?: string
  created_at: string
  updated_at: string
}

export interface TransactionWithAsset extends Transaction {
  asset: {
    id: string
    symbol: string
    name: string
    asset_type: string
  }
}

export class TransactionService {
  static async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    const supabase = await createClient()
    
    // Calculate transaction fee (0.1% for example)
    const fee = data.total_amount * 0.001
    
    // Start a transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        ...data,
        fee,
        status: 'pending' as TransactionStatus,
      })
      .select()
      .single()
    
    if (transactionError) throw transactionError
    
    try {
      // Update holdings
      if (data.type === 'buy') {
        await this.updateHoldingsForBuy(data.portfolio_id, data.asset_id, data.quantity, data.price)
      } else if (data.type === 'sell') {
        await this.updateHoldingsForSell(data.portfolio_id, data.asset_id, data.quantity)
      }
      
      // Mark transaction as completed
      const { data: completedTransaction, error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'completed' as TransactionStatus,
          executed_at: new Date().toISOString(),
        })
        .eq('id', transaction.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      return completedTransaction
    } catch (error) {
      // Mark transaction as failed
      await supabase
        .from('transactions')
        .update({ status: 'failed' as TransactionStatus })
        .eq('id', transaction.id)
      
      throw error
    }
  }
  
  static async getTransactions(
    portfolioId: string,
    filters?: {
      type?: TransactionType
      status?: TransactionStatus
      startDate?: string
      endDate?: string
      limit?: number
    }
  ): Promise<TransactionWithAsset[]> {
    const supabase = await createClient()
    
    let query = supabase
      .from('transactions')
      .select(`
        *,
        asset:assets(
          id,
          symbol,
          name,
          asset_type
        )
      `)
      .eq('portfolio_id', portfolioId)
    
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
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
    
    const { data: transactions, error } = await query
    
    if (error) throw error
    
    return transactions || []
  }
  
  static async getTransactionById(transactionId: string): Promise<TransactionWithAsset | null> {
    const supabase = await createClient()
    
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        *,
        asset:assets(
          id,
          symbol,
          name,
          asset_type
        )
      `)
      .eq('id', transactionId)
      .single()
    
    if (error) throw error
    
    return transaction
  }
  
  static async cancelTransaction(transactionId: string): Promise<void> {
    const supabase = await createClient()
    
    // Check if transaction can be cancelled
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('status')
      .eq('id', transactionId)
      .single()
    
    if (fetchError) throw fetchError
    
    if (transaction.status !== 'pending') {
      throw new Error('Only pending transactions can be cancelled')
    }
    
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'cancelled' as TransactionStatus })
      .eq('id', transactionId)
    
    if (error) throw error
  }
  
  private static async updateHoldingsForBuy(
    portfolioId: string,
    assetId: string,
    quantity: number,
    price: number
  ): Promise<void> {
    const supabase = await createClient()
    
    // Check if holding exists
    const { data: existingHolding, error: fetchError } = await supabase
      .from('holdings')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('asset_id', assetId)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError // PGRST116 = not found
    
    if (existingHolding) {
      // Update existing holding
      const newQuantity = existingHolding.quantity + quantity
      const newTotalCost = (existingHolding.quantity * existingHolding.average_cost) + (quantity * price)
      const newAverageCost = newTotalCost / newQuantity
      
      const { error: updateError } = await supabase
        .from('holdings')
        .update({
          quantity: newQuantity,
          average_cost: newAverageCost,
          total_invested: newTotalCost,
          last_transaction_at: new Date().toISOString(),
        })
        .eq('id', existingHolding.id)
      
      if (updateError) throw updateError
    } else {
      // Create new holding
      const { error: insertError } = await supabase
        .from('holdings')
        .insert({
          portfolio_id: portfolioId,
          asset_id: assetId,
          quantity,
          average_cost: price,
          total_invested: quantity * price,
          last_transaction_at: new Date().toISOString(),
        })
      
      if (insertError) throw insertError
    }
  }
  
  private static async updateHoldingsForSell(
    portfolioId: string,
    assetId: string,
    quantity: number,
    /* price: number */
  ): Promise<void> {
    const supabase = await createClient()
    
    // Get existing holding
    const { data: holding, error: fetchError } = await supabase
      .from('holdings')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('asset_id', assetId)
      .single()
    
    if (fetchError || !holding) {
      throw new Error('No holding found for this asset')
    }
    
    if (holding.quantity < quantity) {
      throw new Error('Insufficient quantity to sell')
    }
    
    const newQuantity = holding.quantity - quantity
    
    if (newQuantity === 0) {
      // Delete holding if quantity becomes zero
      const { error: deleteError } = await supabase
        .from('holdings')
        .delete()
        .eq('id', holding.id)
      
      if (deleteError) throw deleteError
    } else {
      // Update holding with reduced quantity
      const newTotalInvested = newQuantity * holding.average_cost
      
      const { error: updateError } = await supabase
        .from('holdings')
        .update({
          quantity: newQuantity,
          total_invested: newTotalInvested,
          last_transaction_at: new Date().toISOString(),
        })
        .eq('id', holding.id)
      
      if (updateError) throw updateError
    }
  }
  
  static async calculateTransactionStats(portfolioId: string) {
    const supabase = await createClient()
    
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, total_amount, fee')
      .eq('portfolio_id', portfolioId)
      .eq('status', 'completed')
    
    if (error) throw error
    
    const stats = {
      totalBuys: 0,
      totalSells: 0,
      totalFees: 0,
      netInvested: 0,
      transactionCount: transactions?.length || 0,
    }
    
    transactions?.forEach(transaction => {
      if (transaction.type === 'buy') {
        stats.totalBuys += transaction.total_amount
        stats.netInvested += transaction.total_amount
      } else if (transaction.type === 'sell') {
        stats.totalSells += transaction.total_amount
        stats.netInvested -= transaction.total_amount
      }
      stats.totalFees += transaction.fee
    })
    
    return stats
  }
}