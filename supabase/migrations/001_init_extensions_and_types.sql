-- Migration: 001_init_extensions_and_types
-- Description: Initialize database extensions and custom types

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- For advanced indexing

-- Drop existing types if they exist (for clean migration)
DO $$ BEGIN
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS kyc_status CASCADE;
    DROP TYPE IF EXISTS investment_status CASCADE;
    DROP TYPE IF EXISTS transaction_type CASCADE;
    DROP TYPE IF EXISTS transaction_status CASCADE;
    DROP TYPE IF EXISTS achievement_category CASCADE;
    DROP TYPE IF EXISTS achievement_rarity CASCADE;
    DROP TYPE IF EXISTS notification_type CASCADE;
    DROP TYPE IF EXISTS asset_type CASCADE;
    DROP TYPE IF EXISTS investment_frequency CASCADE;
    DROP TYPE IF EXISTS investment_trigger CASCADE;
    DROP TYPE IF EXISTS allocation_strategy CASCADE;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'premium', 'admin', 'moderator');
CREATE TYPE kyc_status AS ENUM ('pending', 'documents_uploaded', 'in_review', 'verified', 'rejected', 'expired');
CREATE TYPE investment_status AS ENUM ('pending', 'processing', 'executed', 'cancelled', 'failed', 'partially_filled');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'buy', 'sell', 'dividend', 'fee', 'transfer', 'round_up');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed');
CREATE TYPE achievement_category AS ENUM ('investment', 'esg', 'streak', 'education', 'social', 'milestone');
CREATE TYPE achievement_rarity AS ENUM ('common', 'rare', 'epic', 'legendary', 'mythic');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error', 'achievement', 'market_alert', 'transaction');
CREATE TYPE asset_type AS ENUM ('stock', 'etf', 'mutual_fund', 'bond', 'crypto', 'commodity', 'reit');
CREATE TYPE investment_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually');
CREATE TYPE investment_trigger AS ENUM ('schedule', 'round_up', 'goal_based', 'market_dip', 'rebalance');
CREATE TYPE allocation_strategy AS ENUM ('equal_weight', 'market_cap', 'esg_weighted', 'risk_weighted', 'custom');

-- Create schemas for better organization
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS investment;
CREATE SCHEMA IF NOT EXISTS gamification;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA investment TO authenticated;
GRANT USAGE ON SCHEMA gamification TO authenticated;
GRANT USAGE ON SCHEMA analytics TO authenticated;