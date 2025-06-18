-- MIOwSIS Database Schema
-- Migration 001: Initial Schema Setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('investor', 'advisor', 'admin');
CREATE TYPE transaction_type AS ENUM ('buy', 'sell', 'dividend', 'fee');
CREATE TYPE investment_status AS ENUM ('active', 'pending', 'sold', 'cancelled');
CREATE TYPE esg_category AS ENUM ('environmental', 'social', 'governance');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'investor',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    date_of_birth DATE,
    kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Portfolios table
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    currency VARCHAR(3) DEFAULT 'USD',
    total_value DECIMAL(20, 2) DEFAULT 0,
    cash_balance DECIMAL(20, 2) DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT unique_user_portfolio_name UNIQUE (user_id, name)
);

-- Create indexes for portfolios
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_created_at ON portfolios(created_at);
CREATE INDEX idx_portfolios_total_value ON portfolios(total_value);

-- Investments table (represents individual investment holdings)
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- stock, bond, etf, mutual_fund, crypto
    quantity DECIMAL(20, 8) NOT NULL,
    average_cost DECIMAL(20, 8) NOT NULL,
    current_price DECIMAL(20, 8),
    current_value DECIMAL(20, 2),
    realized_gains DECIMAL(20, 2) DEFAULT 0,
    unrealized_gains DECIMAL(20, 2) DEFAULT 0,
    status investment_status DEFAULT 'active',
    first_purchase_date DATE,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for investments
CREATE INDEX idx_investments_portfolio_id ON investments(portfolio_id);
CREATE INDEX idx_investments_symbol ON investments(symbol);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_asset_type ON investments(asset_type);
CREATE INDEX idx_investments_current_value ON investments(current_value);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,
    transaction_type transaction_type NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    total_amount DECIMAL(20, 2) NOT NULL,
    fees DECIMAL(20, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    settlement_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for transactions
CREATE INDEX idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX idx_transactions_investment_id ON transactions(investment_id);
CREATE INDEX idx_transactions_symbol ON transactions(symbol);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- ESG Scores table
CREATE TABLE esg_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    provider VARCHAR(100) NOT NULL, -- e.g., 'MSCI', 'Sustainalytics', 'S&P'
    environmental_score DECIMAL(5, 2),
    social_score DECIMAL(5, 2),
    governance_score DECIMAL(5, 2),
    total_score DECIMAL(5, 2),
    rating VARCHAR(10), -- e.g., 'AAA', 'BB', etc.
    assessment_date DATE NOT NULL,
    valid_until DATE,
    methodology_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT unique_esg_score UNIQUE (symbol, provider, assessment_date)
);

-- Create indexes for ESG scores
CREATE INDEX idx_esg_scores_symbol ON esg_scores(symbol);
CREATE INDEX idx_esg_scores_provider ON esg_scores(provider);
CREATE INDEX idx_esg_scores_total_score ON esg_scores(total_score);
CREATE INDEX idx_esg_scores_assessment_date ON esg_scores(assessment_date);

-- Create a composite index for fast portfolio queries
CREATE INDEX idx_investments_portfolio_value ON investments(portfolio_id, current_value) WHERE status = 'active';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_esg_scores_updated_at BEFORE UPDATE ON esg_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to ensure only one default portfolio per user
CREATE OR REPLACE FUNCTION ensure_single_default_portfolio()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE portfolios 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_portfolio_trigger
    BEFORE INSERT OR UPDATE ON portfolios
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_portfolio();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores user account information and authentication details';
COMMENT ON TABLE portfolios IS 'Investment portfolios owned by users';
COMMENT ON TABLE investments IS 'Individual investment holdings within portfolios';
COMMENT ON TABLE transactions IS 'All buy/sell/dividend transactions';
COMMENT ON TABLE esg_scores IS 'Environmental, Social, and Governance scores for investments';

COMMENT ON COLUMN users.kyc_verified IS 'Know Your Customer verification status';
COMMENT ON COLUMN portfolios.total_value IS 'Total portfolio value including all investments and cash';
COMMENT ON COLUMN investments.average_cost IS 'Weighted average cost per unit';
COMMENT ON COLUMN esg_scores.total_score IS 'Combined ESG score (0-100 scale)';