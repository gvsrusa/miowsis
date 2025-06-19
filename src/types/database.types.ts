// Generated TypeScript types for MIOwSIS database schema
// This file should be regenerated when database schema changes

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // User Management Tables
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          full_name: string | null
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          phone_number: string | null
          date_of_birth: string | null
          role: 'user' | 'premium' | 'admin' | 'moderator'
          is_active: boolean
          is_verified: boolean
          kyc_status: 'pending' | 'documents_uploaded' | 'in_review' | 'verified' | 'rejected' | 'expired'
          kyc_submitted_at: string | null
          kyc_verified_at: string | null
          kyc_rejected_at: string | null
          kyc_rejection_reason: string | null
          kyc_expiry_date: string | null
          onboarding_completed: boolean
          onboarding_step: number
          risk_profile: Json
          investment_goals: Json
          preferences: Json
          notification_settings: Json
          subscription_tier: string
          subscription_expires_at: string | null
          daily_investment_limit: number
          monthly_investment_limit: number
          last_login_at: string | null
          login_count: number
          referral_code: string
          referred_by: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }

      kyc_documents: {
        Row: {
          id: string
          user_id: string
          document_type: 'passport' | 'drivers_license' | 'national_id' | 'proof_of_address' | 'bank_statement' | 'tax_document'
          document_number: string | null
          document_url: string
          document_back_url: string | null
          status: 'pending' | 'reviewing' | 'approved' | 'rejected'
          verified_at: string | null
          verified_by: string | null
          rejection_reason: string | null
          issuing_country: string | null
          issue_date: string | null
          expiry_date: string | null
          metadata: Json
          is_encrypted: boolean
          checksum: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['kyc_documents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['kyc_documents']['Insert']>
      }

      bank_accounts: {
        Row: {
          id: string
          user_id: string
          account_name: string
          account_number_encrypted: string
          routing_number_encrypted: string
          account_type: 'checking' | 'savings'
          bank_name: string
          bank_code: string | null
          swift_code: string | null
          is_primary: boolean
          is_verified: boolean
          is_active: boolean
          verification_method: 'micro_deposit' | 'plaid' | 'manual' | null
          verified_at: string | null
          plaid_account_id: string | null
          plaid_access_token_encrypted: string | null
          plaid_item_id: string | null
          daily_limit: number | null
          monthly_limit: number | null
          last_used_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bank_accounts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bank_accounts']['Insert']>
      }

      // Portfolio Management Tables
      portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          portfolio_type: 'individual' | 'joint' | 'retirement' | 'education' | 'custom'
          total_value: number
          total_invested: number
          total_returns: number
          total_returns_percentage: number
          cash_balance: number
          daily_change: number
          daily_change_percentage: number
          weekly_change: number
          weekly_change_percentage: number
          monthly_change: number
          monthly_change_percentage: number
          yearly_change: number
          yearly_change_percentage: number
          all_time_high: number
          all_time_high_date: string | null
          risk_score: number | null
          volatility: number | null
          sharpe_ratio: number | null
          beta: number | null
          esg_score: number | null
          carbon_offset: number
          is_active: boolean
          is_public: boolean
          is_watchlist: boolean
          auto_rebalance: boolean
          rebalance_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually' | null
          target_allocations: Json
          settings: Json
          created_at: string
          updated_at: string
          last_calculated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['portfolios']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['portfolios']['Insert']>
      }

      assets: {
        Row: {
          id: string
          symbol: string
          name: string
          asset_type: 'stock' | 'etf' | 'mutual_fund' | 'bond' | 'crypto' | 'commodity' | 'reit'
          exchange: string | null
          currency: string
          isin: string | null
          cusip: string | null
          current_price: number | null
          previous_close: number | null
          day_open: number | null
          day_high: number | null
          day_low: number | null
          volume: number | null
          market_cap: number | null
          sector: string | null
          industry: string | null
          country: string | null
          description: string | null
          website_url: string | null
          logo_url: string | null
          is_tradable: boolean
          is_fractional: boolean
          min_trade_size: number
          data_source: string | null
          metadata: Json
          last_updated: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['assets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['assets']['Insert']>
      }

      holdings: {
        Row: {
          id: string
          portfolio_id: string
          asset_id: string
          quantity: number
          average_cost: number
          total_invested: number
          current_price: number | null
          current_value: number | null
          unrealized_pnl: number | null
          unrealized_pnl_percentage: number | null
          realized_pnl: number | null
          portfolio_percentage: number | null
          target_percentage: number | null
          first_purchase_date: string | null
          last_transaction_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['holdings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['holdings']['Insert']>
      }

      // Transaction Tables
      transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: 'deposit' | 'withdrawal' | 'buy' | 'sell' | 'dividend' | 'fee' | 'transfer' | 'round_up'
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'reversed'
          amount: number
          fee: number
          tax: number
          net_amount: number | null
          currency: string
          exchange_rate: number
          portfolio_id: string | null
          asset_id: string | null
          bank_account_id: string | null
          automation_rule_id: string | null
          quantity: number | null
          price_per_unit: number | null
          external_reference_id: string | null
          payment_method: 'bank_transfer' | 'ach' | 'wire' | 'debit_card' | 'credit_card' | 'crypto' | null
          description: string | null
          notes: string | null
          metadata: Json
          initiated_at: string
          processed_at: string | null
          completed_at: string | null
          failed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }

      investment_orders: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string
          asset_id: string
          order_type: 'market_buy' | 'market_sell' | 'limit_buy' | 'limit_sell' | 'stop_loss' | 'stop_limit'
          order_side: 'buy' | 'sell'
          status: 'pending' | 'processing' | 'executed' | 'cancelled' | 'failed' | 'partially_filled'
          quantity: number
          filled_quantity: number
          remaining_quantity: number | null
          limit_price: number | null
          stop_price: number | null
          average_fill_price: number | null
          estimated_total: number | null
          filled_amount: number
          commission: number
          time_in_force: 'day' | 'gtc' | 'ioc' | 'fok'
          expires_at: string | null
          automation_rule_id: string | null
          parent_order_id: string | null
          transaction_id: string | null
          broker_order_id: string | null
          notes: string | null
          metadata: Json
          placed_at: string
          executed_at: string | null
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['investment_orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['investment_orders']['Insert']>
      }

      recurring_investments: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string
          name: string
          amount: number
          frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'
          start_date: string
          end_date: string | null
          next_investment_date: string
          day_of_month: number | null
          day_of_week: number | null
          is_active: boolean
          is_paused: boolean
          pause_reason: string | null
          total_invested: number
          execution_count: number
          last_execution_date: string | null
          last_execution_status: string | null
          failed_attempts: number
          allocation_strategy: 'equal_weight' | 'market_cap' | 'esg_weighted' | 'risk_weighted' | 'custom'
          asset_allocations: Json
          skip_weekends: boolean
          skip_holidays: boolean
          retry_failed: boolean
          notification_enabled: boolean
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['recurring_investments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['recurring_investments']['Insert']>
      }

      // Automation Tables
      automation_rules: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string
          name: string
          description: string | null
          rule_type: 'smart_invest' | 'round_up' | 'recurring' | 'rebalance' | 'tax_loss_harvest'
          is_active: boolean
          is_paused: boolean
          pause_reason: string | null
          activation_date: string | null
          deactivation_date: string | null
          investment_amount: number | null
          min_investment_amount: number
          max_investment_amount: number | null
          frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually' | null
          trigger_type: 'schedule' | 'round_up' | 'goal_based' | 'market_dip' | 'rebalance'
          trigger_conditions: Json
          round_up_multiplier: number
          round_up_threshold: number
          market_dip_threshold: number | null
          market_dip_cooldown_hours: number
          last_market_dip_trigger: string | null
          allocation_strategy: 'equal_weight' | 'market_cap' | 'esg_weighted' | 'risk_weighted' | 'custom'
          asset_allocation: Json
          dynamic_allocation: boolean
          next_execution: string | null
          last_execution: string | null
          total_invested: number
          execution_count: number
          successful_executions: number
          failed_executions: number
          total_returns: number
          average_return_percentage: number
          best_execution_return: number | null
          worst_execution_return: number | null
          settings: Json
          notification_settings: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['automation_rules']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['automation_rules']['Insert']>
      }

      round_up_accumulator: {
        Row: {
          id: string
          user_id: string
          automation_rule_id: string
          transaction_id: string
          merchant_name: string | null
          merchant_category: string | null
          transaction_date: string | null
          original_amount: number
          rounded_amount: number
          round_up_amount: number
          multiplied_amount: number
          is_invested: boolean
          is_cancelled: boolean
          invested_at: string | null
          investment_order_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['round_up_accumulator']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['round_up_accumulator']['Insert']>
      }

      // ESG Tables
      esg_metrics: {
        Row: {
          id: string
          asset_id: string
          total_score: number | null
          environmental_score: number | null
          social_score: number | null
          governance_score: number | null
          carbon_footprint: number | null
          carbon_intensity: number | null
          renewable_energy_percentage: number | null
          water_usage: number | null
          waste_recycling_percentage: number | null
          diversity_score: number | null
          employee_satisfaction_score: number | null
          community_impact_score: number | null
          human_rights_score: number | null
          data_privacy_score: number | null
          board_diversity_percentage: number | null
          executive_compensation_ratio: number | null
          transparency_score: number | null
          ethics_score: number | null
          shareholder_rights_score: number | null
          controversy_score: number | null
          controversy_details: Json
          esg_risk_level: 'negligible' | 'low' | 'medium' | 'high' | 'severe' | null
          data_provider: string | null
          data_quality_score: number | null
          last_updated: string
          certifications: Json
          un_sdg_alignment: Json
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['esg_metrics']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['esg_metrics']['Insert']>
      }

      impact_tracking: {
        Row: {
          id: string
          portfolio_id: string
          recorded_at: string
          period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          esg_score: number | null
          environmental_score: number | null
          social_score: number | null
          governance_score: number | null
          carbon_footprint: number | null
          carbon_offset: number | null
          net_carbon_impact: number | null
          renewable_exposure: number | null
          green_revenue_percentage: number | null
          social_impact: number | null
          jobs_supported: number | null
          community_investment: number | null
          total_value: number | null
          esg_aligned_value: number | null
          esg_aligned_percentage: number | null
          holdings_count: number | null
          avg_esg_score: number | null
          top_esg_holdings: Json | null
          bottom_esg_holdings: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['impact_tracking']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['impact_tracking']['Insert']>
      }

      impact_metrics: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string | null
          metric_type: 'carbon_offset' | 'renewable_energy' | 'water_saved' | 'trees_planted' | 'jobs_created' | 'education_funded' | 'healthcare_provided' | 'poverty_alleviation' | 'gender_equality' | 'clean_energy' | 'sustainable_cities' | 'responsible_consumption'
          value: number
          unit: string
          description: string | null
          date: string
          period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          calculation_method: string | null
          data_sources: Json
          confidence_level: number | null
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['impact_metrics']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['impact_metrics']['Insert']>
      }

      // Gamification Tables
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          detailed_description: string | null
          category: 'investment' | 'esg' | 'streak' | 'education' | 'social' | 'milestone'
          rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
          icon: string
          icon_url: string | null
          badge_color: string | null
          animation_type: string | null
          points: number
          xp_reward: number
          criteria: Json
          prerequisite_achievements: string[] | null
          is_active: boolean
          is_hidden: boolean
          is_seasonal: boolean
          season_start: string | null
          season_end: string | null
          total_unlocks: number
          unlock_rate: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>
      }

      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          unlocked_at: string
          unlock_trigger: string | null
          progress: number
          progress_data: Json
          is_featured: boolean
          is_hidden: boolean
          is_shared: boolean
          shared_at: string | null
          share_count: number
        }
        Insert: Omit<Database['public']['Tables']['user_achievements']['Row'], 'id' | 'unlocked_at'>
        Update: Partial<Database['public']['Tables']['user_achievements']['Insert']>
      }

      user_progress: {
        Row: {
          id: string
          user_id: string
          total_points: number
          total_xp: number
          level: number
          level_progress: number
          investment_streak: number
          login_streak: number
          last_investment_date: string | null
          last_login_date: string | null
          longest_investment_streak: number
          longest_login_streak: number
          total_investments: number
          total_transactions: number
          portfolios_created: number
          goals_completed: number
          tutorials_completed: number
          articles_read: number
          videos_watched: number
          quizzes_passed: number
          referrals_made: number
          community_posts: number
          helpful_votes_received: number
          global_rank: number | null
          country_rank: number | null
          weekly_rank: number | null
          current_title: string | null
          unlocked_titles: string[]
          featured_badges: string[]
          statistics: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_progress']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_progress']['Insert']>
      }

      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'market_alert' | 'transaction'
          category: 'transaction' | 'achievement' | 'market' | 'social' | 'system' | 'education' | null
          priority: 'low' | 'normal' | 'high' | 'urgent'
          expires_at: string | null
          action_type: 'view' | 'navigate' | 'external_link' | 'dismiss' | null
          action_url: string | null
          action_data: Json
          related_entity_type: string | null
          related_entity_id: string | null
          is_read: boolean
          read_at: string | null
          is_archived: boolean
          archived_at: string | null
          channels: Json
          email_sent: boolean
          push_sent: boolean
          sms_sent: boolean
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
    Views: {
      mv_user_portfolio_summary: {
        Row: {
          user_id: string
          portfolio_count: number
          total_portfolio_value: number
          total_amount_invested: number
          total_returns: number
          avg_return_percentage: number
          largest_portfolio_value: number
          avg_esg_score: number
          unique_assets_count: number
        }
      }
      mv_asset_performance: {
        Row: {
          id: string
          symbol: string
          name: string
          asset_type: string
          current_price: number
          held_by_portfolios: number
          total_quantity_held: number
          total_value_held: number
          avg_unrealized_pnl_percentage: number
          esg_score: number | null
          environmental_score: number | null
          social_score: number | null
          governance_score: number | null
        }
      }
      mv_daily_transaction_summary: {
        Row: {
          transaction_date: string
          transaction_count: number
          unique_users: number
          total_buy_amount: number
          total_sell_amount: number
          total_deposit_amount: number
          total_withdrawal_amount: number
          total_fees_collected: number
          avg_transaction_amount: number
        }
      }
    }
    Functions: {
      calculate_portfolio_metrics: {
        Args: { p_portfolio_id: string }
        Returns: void
      }
      check_achievements: {
        Args: { p_user_id: string }
        Returns: Array<{
          achievement_id: string
          achievement_name: string
          points: number
        }>
      }
      add_user_points: {
        Args: {
          p_user_id: string
          p_points: number
          p_reason?: string
        }
        Returns: void
      }
      update_investment_streak: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_dashboard_data: {
        Args: { p_user_id: string }
        Returns: {
          total_portfolio_value: number
          total_invested: number
          total_returns: number
          total_returns_percentage: number
          portfolio_count: number
          achievement_count: number
          user_level: number
          investment_streak: number
          unread_notifications: number
        }
      }
      get_portfolio_holdings: {
        Args: { p_portfolio_id: string }
        Returns: Array<{
          asset_id: string
          symbol: string
          name: string
          quantity: number
          current_price: number
          current_value: number
          average_cost: number
          unrealized_pnl: number
          unrealized_pnl_percentage: number
          portfolio_percentage: number
          esg_score: number | null
        }>
      }
    }
    Enums: {
      user_role: 'user' | 'premium' | 'admin' | 'moderator'
      kyc_status: 'pending' | 'documents_uploaded' | 'in_review' | 'verified' | 'rejected' | 'expired'
      investment_status: 'pending' | 'processing' | 'executed' | 'cancelled' | 'failed' | 'partially_filled'
      transaction_type: 'deposit' | 'withdrawal' | 'buy' | 'sell' | 'dividend' | 'fee' | 'transfer' | 'round_up'
      transaction_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'reversed'
      achievement_category: 'investment' | 'esg' | 'streak' | 'education' | 'social' | 'milestone'
      achievement_rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
      notification_type: 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'market_alert' | 'transaction'
      asset_type: 'stock' | 'etf' | 'mutual_fund' | 'bond' | 'crypto' | 'commodity' | 'reit'
      investment_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'
      investment_trigger: 'schedule' | 'round_up' | 'goal_based' | 'market_dip' | 'rebalance'
      allocation_strategy: 'equal_weight' | 'market_cap' | 'esg_weighted' | 'risk_weighted' | 'custom'
    }
  }
}