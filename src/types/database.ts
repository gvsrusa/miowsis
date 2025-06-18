export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'admin' | 'moderator'
          kyc_status: 'pending' | 'in_progress' | 'verified' | 'rejected'
          kyc_completed_at: string | null
          onboarding_completed: boolean
          risk_profile: Json | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'moderator'
          kyc_status?: 'pending' | 'in_progress' | 'verified' | 'rejected'
          kyc_completed_at?: string | null
          onboarding_completed?: boolean
          risk_profile?: Json | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'moderator'
          kyc_status?: 'pending' | 'in_progress' | 'verified' | 'rejected'
          kyc_completed_at?: string | null
          onboarding_completed?: boolean
          risk_profile?: Json | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          total_value: number
          total_invested: number
          total_returns: number
          risk_score: number | null
          esg_score: number | null
          is_active: boolean
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          total_value?: number
          total_invested?: number
          total_returns?: number
          risk_score?: number | null
          esg_score?: number | null
          is_active?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          total_value?: number
          total_invested?: number
          total_returns?: number
          risk_score?: number | null
          esg_score?: number | null
          is_active?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          symbol: string
          name: string
          asset_type: string
          current_price: number | null
          market_cap: number | null
          sector: string | null
          industry: string | null
          esg_scores: Json
          metadata: Json
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          symbol: string
          name: string
          asset_type: string
          current_price?: number | null
          market_cap?: number | null
          sector?: string | null
          industry?: string | null
          esg_scores?: Json
          metadata?: Json
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          symbol?: string
          name?: string
          asset_type?: string
          current_price?: number | null
          market_cap?: number | null
          sector?: string | null
          industry?: string | null
          esg_scores?: Json
          metadata?: Json
          last_updated?: string
          created_at?: string
        }
      }
      holdings: {
        Row: {
          id: string
          portfolio_id: string
          asset_id: string
          quantity: number
          average_cost: number
          current_value: number | null
          unrealized_pnl: number | null
          percentage: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          asset_id: string
          quantity: number
          average_cost: number
          current_value?: number | null
          unrealized_pnl?: number | null
          percentage?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          asset_id?: string
          quantity?: number
          average_cost?: number
          current_value?: number | null
          unrealized_pnl?: number | null
          percentage?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string | null
          transaction_type: 'deposit' | 'withdrawal' | 'investment' | 'dividend' | 'fee'
          amount: number
          status: 'pending' | 'executed' | 'cancelled' | 'failed'
          description: string | null
          metadata: Json
          executed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          portfolio_id?: string | null
          transaction_type: 'deposit' | 'withdrawal' | 'investment' | 'dividend' | 'fee'
          amount: number
          status?: 'pending' | 'executed' | 'cancelled' | 'failed'
          description?: string | null
          metadata?: Json
          executed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          portfolio_id?: string | null
          transaction_type?: 'deposit' | 'withdrawal' | 'investment' | 'dividend' | 'fee'
          amount?: number
          status?: 'pending' | 'executed' | 'cancelled' | 'failed'
          description?: string | null
          metadata?: Json
          executed_at?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          metadata: Json
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          metadata?: Json
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          metadata?: Json
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
    }
  }
}