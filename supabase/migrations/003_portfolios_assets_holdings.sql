-- Migration: 003_portfolios_assets_holdings
-- Description: Create portfolios, assets, and holdings tables

-- Portfolios table
CREATE TABLE public.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Portfolio details
    name TEXT NOT NULL,
    description TEXT,
    portfolio_type TEXT DEFAULT 'individual' CHECK (portfolio_type IN ('individual', 'joint', 'retirement', 'education', 'custom')),
    
    -- Financial metrics
    total_value DECIMAL(20, 2) DEFAULT 0.00,
    total_invested DECIMAL(20, 2) DEFAULT 0.00,
    total_returns DECIMAL(20, 2) DEFAULT 0.00,
    total_returns_percentage DECIMAL(10, 4) DEFAULT 0.00,
    cash_balance DECIMAL(20, 2) DEFAULT 0.00,
    
    -- Performance metrics
    daily_change DECIMAL(15, 2) DEFAULT 0.00,
    daily_change_percentage DECIMAL(10, 4) DEFAULT 0.00,
    weekly_change DECIMAL(15, 2) DEFAULT 0.00,
    weekly_change_percentage DECIMAL(10, 4) DEFAULT 0.00,
    monthly_change DECIMAL(15, 2) DEFAULT 0.00,
    monthly_change_percentage DECIMAL(10, 4) DEFAULT 0.00,
    yearly_change DECIMAL(15, 2) DEFAULT 0.00,
    yearly_change_percentage DECIMAL(10, 4) DEFAULT 0.00,
    all_time_high DECIMAL(20, 2) DEFAULT 0.00,
    all_time_high_date DATE,
    
    -- Risk and ESG metrics
    risk_score INTEGER CHECK (risk_score >= 1 AND risk_score <= 10),
    volatility DECIMAL(10, 4),
    sharpe_ratio DECIMAL(10, 4),
    beta DECIMAL(10, 4),
    esg_score INTEGER CHECK (esg_score >= 0 AND esg_score <= 100),
    carbon_offset DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Settings and status
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,
    is_watchlist BOOLEAN DEFAULT FALSE,
    auto_rebalance BOOLEAN DEFAULT FALSE,
    rebalance_frequency investment_frequency,
    target_allocations JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_calculated_at TIMESTAMP WITH TIME ZONE
);

-- Assets master table
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Asset identification
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    asset_type asset_type NOT NULL,
    exchange TEXT,
    currency TEXT DEFAULT 'USD',
    isin TEXT,
    cusip TEXT,
    
    -- Current market data
    current_price DECIMAL(20, 6),
    previous_close DECIMAL(20, 6),
    day_open DECIMAL(20, 6),
    day_high DECIMAL(20, 6),
    day_low DECIMAL(20, 6),
    volume BIGINT,
    market_cap BIGINT,
    
    -- Additional data
    sector TEXT,
    industry TEXT,
    country TEXT,
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    
    -- Trading info
    is_tradable BOOLEAN DEFAULT TRUE,
    is_fractional BOOLEAN DEFAULT TRUE,
    min_trade_size DECIMAL(10, 6) DEFAULT 0.001,
    
    -- Metadata
    data_source TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holdings table (portfolio positions)
CREATE TABLE public.holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id),
    
    -- Position details
    quantity DECIMAL(20, 8) NOT NULL CHECK (quantity >= 0),
    average_cost DECIMAL(20, 6) NOT NULL,
    total_invested DECIMAL(20, 2) NOT NULL,
    
    -- Current values
    current_price DECIMAL(20, 6),
    current_value DECIMAL(20, 2),
    
    -- Performance metrics
    unrealized_pnl DECIMAL(20, 2),
    unrealized_pnl_percentage DECIMAL(10, 4),
    realized_pnl DECIMAL(20, 2),
    
    -- Portfolio allocation
    portfolio_percentage DECIMAL(5, 2),
    target_percentage DECIMAL(5, 2),
    
    -- Metadata
    first_purchase_date DATE,
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique holdings per portfolio
    UNIQUE(portfolio_id, asset_id)
);

-- Asset price history for tracking
CREATE TABLE public.asset_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    
    -- Price data
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open DECIMAL(20, 6),
    high DECIMAL(20, 6),
    low DECIMAL(20, 6),
    close DECIMAL(20, 6),
    volume BIGINT,
    
    -- Additional metrics
    market_cap BIGINT,
    
    -- Make sure we don't have duplicate entries
    UNIQUE(asset_id, timestamp)
);

-- Portfolio performance history
CREATE TABLE public.portfolio_performance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    
    -- Snapshot date
    date DATE NOT NULL,
    
    -- Values
    total_value DECIMAL(20, 2),
    total_invested DECIMAL(20, 2),
    total_returns DECIMAL(20, 2),
    total_returns_percentage DECIMAL(10, 4),
    
    -- Daily metrics
    daily_change DECIMAL(15, 2),
    daily_change_percentage DECIMAL(10, 4),
    
    -- Holdings snapshot
    holdings_count INTEGER,
    top_holdings JSONB,
    
    -- Risk metrics
    volatility DECIMAL(10, 4),
    sharpe_ratio DECIMAL(10, 4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one snapshot per day
    UNIQUE(portfolio_id, date)
);

-- Watchlist items
CREATE TABLE public.watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id),
    
    -- Alerts
    price_alert_above DECIMAL(20, 6),
    price_alert_below DECIMAL(20, 6),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(user_id, asset_id)
);

-- Create indexes
CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX idx_portfolios_active ON public.portfolios(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_portfolios_updated_at ON public.portfolios(updated_at DESC);

CREATE INDEX idx_assets_symbol ON public.assets(symbol);
CREATE INDEX idx_assets_type ON public.assets(asset_type);
CREATE INDEX idx_assets_tradable ON public.assets(is_tradable) WHERE is_tradable = TRUE;
CREATE INDEX idx_assets_last_updated ON public.assets(last_updated DESC);

CREATE INDEX idx_holdings_portfolio_id ON public.holdings(portfolio_id);
CREATE INDEX idx_holdings_asset_id ON public.holdings(asset_id);
CREATE INDEX idx_holdings_value ON public.holdings(current_value DESC);
CREATE INDEX idx_holdings_portfolio_asset ON public.holdings(portfolio_id, asset_id);

CREATE INDEX idx_asset_price_history_asset_id ON public.asset_price_history(asset_id);
CREATE INDEX idx_asset_price_history_timestamp ON public.asset_price_history(asset_id, timestamp DESC);

CREATE INDEX idx_portfolio_performance_portfolio_id ON public.portfolio_performance_history(portfolio_id);
CREATE INDEX idx_portfolio_performance_date ON public.portfolio_performance_history(portfolio_id, date DESC);

CREATE INDEX idx_watchlist_user_id ON public.watchlist_items(user_id);
CREATE INDEX idx_watchlist_asset_id ON public.watchlist_items(asset_id);

-- Enable Row Level Security
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

-- Note: assets and asset_price_history are public read, so no RLS needed
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolios
CREATE POLICY "Users can view own portfolios" 
    ON public.portfolios FOR SELECT 
    USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can create own portfolios" 
    ON public.portfolios FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" 
    ON public.portfolios FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" 
    ON public.portfolios FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for holdings
CREATE POLICY "Users can view holdings of own portfolios" 
    ON public.holdings FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE id = holdings.portfolio_id 
        AND (user_id = auth.uid() OR is_public = TRUE)
    ));

CREATE POLICY "Users can manage holdings of own portfolios" 
    ON public.holdings FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE id = holdings.portfolio_id 
        AND user_id = auth.uid()
    ));

-- RLS Policies for portfolio performance history
CREATE POLICY "Users can view performance of own portfolios" 
    ON public.portfolio_performance_history FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE id = portfolio_performance_history.portfolio_id 
        AND (user_id = auth.uid() OR is_public = TRUE)
    ));

CREATE POLICY "System can insert performance history" 
    ON public.portfolio_performance_history FOR INSERT 
    WITH CHECK (TRUE);

-- RLS Policies for watchlist
CREATE POLICY "Users can manage own watchlist" 
    ON public.watchlist_items FOR ALL 
    USING (auth.uid() = user_id);

-- RLS Policies for assets (public read)
CREATE POLICY "Anyone can view assets" 
    ON public.assets FOR SELECT 
    USING (TRUE);

CREATE POLICY "System can manage assets" 
    ON public.assets FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'moderator')
    ));

-- RLS Policies for asset price history (public read)
CREATE POLICY "Anyone can view price history" 
    ON public.asset_price_history FOR SELECT 
    USING (TRUE);

CREATE POLICY "System can insert price history" 
    ON public.asset_price_history FOR INSERT 
    WITH CHECK (TRUE);