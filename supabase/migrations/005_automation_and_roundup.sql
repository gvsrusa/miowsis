-- Migration: 005_automation_and_roundup
-- Description: Create automation rules, round-up accumulator, and smart investment tables

-- Automation rules table
CREATE TABLE public.automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    
    -- Rule details
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('smart_invest', 'round_up', 'recurring', 'rebalance', 'tax_loss_harvest')),
    
    -- Status and activation
    is_active BOOLEAN DEFAULT TRUE,
    is_paused BOOLEAN DEFAULT FALSE,
    pause_reason TEXT,
    activation_date DATE,
    deactivation_date DATE,
    
    -- Investment configuration
    investment_amount DECIMAL(15, 2),
    min_investment_amount DECIMAL(15, 2) DEFAULT 1.00,
    max_investment_amount DECIMAL(15, 2),
    
    -- Scheduling and triggers
    frequency investment_frequency,
    trigger_type investment_trigger NOT NULL,
    trigger_conditions JSONB DEFAULT '{}',
    
    -- Round-up specific
    round_up_multiplier DECIMAL(5, 2) DEFAULT 1.0 CHECK (round_up_multiplier >= 1.0 AND round_up_multiplier <= 10.0),
    round_up_threshold DECIMAL(10, 2) DEFAULT 5.00,
    
    -- Market dip specific
    market_dip_threshold DECIMAL(5, 2) CHECK (market_dip_threshold >= 0 AND market_dip_threshold <= 100),
    market_dip_cooldown_hours INTEGER DEFAULT 24,
    last_market_dip_trigger TIMESTAMP WITH TIME ZONE,
    
    -- Allocation strategy
    allocation_strategy allocation_strategy NOT NULL DEFAULT 'equal_weight',
    asset_allocation JSONB NOT NULL DEFAULT '{}', -- {asset_id: percentage}
    dynamic_allocation BOOLEAN DEFAULT FALSE,
    
    -- Execution tracking
    next_execution TIMESTAMP WITH TIME ZONE,
    last_execution TIMESTAMP WITH TIME ZONE,
    total_invested DECIMAL(20, 2) DEFAULT 0,
    execution_count INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    
    -- Performance metrics
    total_returns DECIMAL(20, 2) DEFAULT 0,
    average_return_percentage DECIMAL(10, 4) DEFAULT 0,
    best_execution_return DECIMAL(15, 2),
    worst_execution_return DECIMAL(15, 2),
    
    -- Settings
    settings JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{"email": true, "push": true}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Round-up accumulator for micro-investing
CREATE TABLE public.round_up_accumulator (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    automation_rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
    
    -- Transaction reference
    transaction_id TEXT NOT NULL, -- External transaction ID
    merchant_name TEXT,
    merchant_category TEXT,
    transaction_date DATE,
    
    -- Amounts
    original_amount DECIMAL(10, 2) NOT NULL,
    rounded_amount DECIMAL(10, 2) NOT NULL,
    round_up_amount DECIMAL(10, 2) NOT NULL,
    multiplied_amount DECIMAL(10, 2) NOT NULL, -- After applying multiplier
    
    -- Status
    is_invested BOOLEAN DEFAULT FALSE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    invested_at TIMESTAMP WITH TIME ZONE,
    investment_order_id UUID REFERENCES public.investment_orders(id),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation execution history
CREATE TABLE public.automation_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
    
    -- Execution details
    execution_type TEXT NOT NULL CHECK (execution_type IN ('scheduled', 'triggered', 'manual', 'test')),
    trigger_reason TEXT,
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    error_details JSONB,
    
    -- Investment details
    planned_amount DECIMAL(15, 2),
    executed_amount DECIMAL(15, 2),
    
    -- Allocations executed
    allocations JSONB, -- Array of {asset_id, amount, quantity, price}
    
    -- Related entities
    transaction_ids UUID[], -- Array of transaction IDs created
    order_ids UUID[], -- Array of order IDs created
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart investment suggestions
CREATE TABLE public.smart_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Suggestion details
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('buy', 'sell', 'rebalance', 'new_asset', 'risk_adjustment')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Target
    portfolio_id UUID REFERENCES public.portfolios(id),
    asset_id UUID REFERENCES public.assets(id),
    
    -- Recommendation
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reasoning TEXT,
    
    -- Suggested action
    suggested_amount DECIMAL(15, 2),
    suggested_quantity DECIMAL(20, 8),
    suggested_percentage DECIMAL(5, 2),
    
    -- Expected impact
    expected_return_impact DECIMAL(10, 4),
    expected_risk_impact DECIMAL(10, 4),
    expected_esg_impact INTEGER,
    
    -- Validity
    valid_until TIMESTAMP WITH TIME ZONE,
    confidence_score DECIMAL(5, 2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    
    -- User interaction
    is_viewed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    is_accepted BOOLEAN,
    accepted_at TIMESTAMP WITH TIME ZONE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    dismissal_reason TEXT,
    
    -- Execution
    automation_rule_id UUID REFERENCES public.automation_rules(id),
    executed_at TIMESTAMP WITH TIME ZONE,
    execution_result JSONB,
    
    -- Metadata
    data_sources JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market conditions tracking for triggers
CREATE TABLE public.market_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Market data
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    market_index TEXT NOT NULL, -- e.g., 'SPX', 'DJI', 'IXIC'
    
    -- Values
    current_value DECIMAL(20, 6),
    previous_close DECIMAL(20, 6),
    day_change_percentage DECIMAL(10, 4),
    week_change_percentage DECIMAL(10, 4),
    month_change_percentage DECIMAL(10, 4),
    
    -- Volatility metrics
    vix_value DECIMAL(10, 4),
    market_volatility DECIMAL(10, 4),
    
    -- Market sentiment
    sentiment_score DECIMAL(5, 2), -- -100 to 100
    fear_greed_index INTEGER, -- 0 to 100
    
    -- Volume data
    volume BIGINT,
    average_volume BIGINT,
    volume_ratio DECIMAL(10, 4),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(market_index, timestamp)
);

-- Create indexes
CREATE INDEX idx_automation_rules_user_id ON public.automation_rules(user_id);
CREATE INDEX idx_automation_rules_portfolio_id ON public.automation_rules(portfolio_id);
CREATE INDEX idx_automation_rules_active ON public.automation_rules(is_active, is_paused) WHERE is_active = TRUE AND is_paused = FALSE;
CREATE INDEX idx_automation_rules_trigger_type ON public.automation_rules(trigger_type);
CREATE INDEX idx_automation_rules_next_execution ON public.automation_rules(next_execution) WHERE is_active = TRUE;

CREATE INDEX idx_round_up_accumulator_user_id ON public.round_up_accumulator(user_id);
CREATE INDEX idx_round_up_accumulator_rule_id ON public.round_up_accumulator(automation_rule_id);
CREATE INDEX idx_round_up_accumulator_not_invested ON public.round_up_accumulator(automation_rule_id, is_invested) WHERE is_invested = FALSE;
CREATE INDEX idx_round_up_accumulator_transaction_date ON public.round_up_accumulator(transaction_date DESC);

CREATE INDEX idx_automation_executions_rule_id ON public.automation_executions(automation_rule_id);
CREATE INDEX idx_automation_executions_status ON public.automation_executions(status);
CREATE INDEX idx_automation_executions_created_at ON public.automation_executions(created_at DESC);

CREATE INDEX idx_smart_suggestions_user_id ON public.smart_suggestions(user_id);
CREATE INDEX idx_smart_suggestions_type ON public.smart_suggestions(suggestion_type);
CREATE INDEX idx_smart_suggestions_priority ON public.smart_suggestions(priority);
CREATE INDEX idx_smart_suggestions_not_viewed ON public.smart_suggestions(user_id, is_viewed) WHERE is_viewed = FALSE;
CREATE INDEX idx_smart_suggestions_valid ON public.smart_suggestions(valid_until) WHERE valid_until > NOW();

CREATE INDEX idx_market_conditions_timestamp ON public.market_conditions(timestamp DESC);
CREATE INDEX idx_market_conditions_index ON public.market_conditions(market_index, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_up_accumulator ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_conditions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation rules
CREATE POLICY "Users can manage own automation rules" 
    ON public.automation_rules FOR ALL 
    USING (auth.uid() = user_id);

-- RLS Policies for round-up accumulator
CREATE POLICY "Users can view own round-ups" 
    ON public.round_up_accumulator FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage round-ups" 
    ON public.round_up_accumulator FOR ALL 
    USING (TRUE); -- System manages round-ups

-- RLS Policies for automation executions
CREATE POLICY "Users can view own automation executions" 
    ON public.automation_executions FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.automation_rules 
        WHERE id = automation_executions.automation_rule_id 
        AND user_id = auth.uid()
    ));

CREATE POLICY "System can manage executions" 
    ON public.automation_executions FOR ALL 
    USING (TRUE);

-- RLS Policies for smart suggestions
CREATE POLICY "Users can view own suggestions" 
    ON public.smart_suggestions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions" 
    ON public.smart_suggestions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage suggestions" 
    ON public.smart_suggestions FOR INSERT 
    WITH CHECK (TRUE);

-- RLS Policies for market conditions (public read)
CREATE POLICY "Anyone can view market conditions" 
    ON public.market_conditions FOR SELECT 
    USING (TRUE);

CREATE POLICY "System can insert market conditions" 
    ON public.market_conditions FOR INSERT 
    WITH CHECK (TRUE);

-- Add foreign key reference from transactions table
ALTER TABLE public.transactions 
    ADD CONSTRAINT fk_transactions_automation_rule 
    FOREIGN KEY (automation_rule_id) 
    REFERENCES public.automation_rules(id) 
    ON DELETE SET NULL;