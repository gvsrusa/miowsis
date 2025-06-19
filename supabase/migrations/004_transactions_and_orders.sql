-- Migration: 004_transactions_and_orders
-- Description: Create transactions, investment orders, and related tables

-- Transactions table (financial movements)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type transaction_type NOT NULL,
    status transaction_status DEFAULT 'pending',
    
    -- Amounts
    amount DECIMAL(20, 2) NOT NULL,
    fee DECIMAL(10, 2) DEFAULT 0.00,
    tax DECIMAL(10, 2) DEFAULT 0.00,
    net_amount DECIMAL(20, 2), -- amount - fee - tax
    
    -- Currency
    currency TEXT DEFAULT 'USD',
    exchange_rate DECIMAL(10, 6) DEFAULT 1.000000,
    
    -- Related entities
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES public.assets(id),
    bank_account_id UUID REFERENCES public.bank_accounts(id),
    automation_rule_id UUID, -- Will reference automation_rules table
    
    -- Additional details
    quantity DECIMAL(20, 8), -- For buy/sell transactions
    price_per_unit DECIMAL(20, 6), -- For buy/sell transactions
    
    -- External references
    external_reference_id TEXT,
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'ach', 'wire', 'debit_card', 'credit_card', 'crypto')),
    
    -- Metadata
    description TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investment orders (buy/sell orders)
CREATE TABLE public.investment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id),
    
    -- Order details
    order_type TEXT NOT NULL CHECK (order_type IN ('market_buy', 'market_sell', 'limit_buy', 'limit_sell', 'stop_loss', 'stop_limit')),
    order_side TEXT NOT NULL CHECK (order_side IN ('buy', 'sell')),
    status investment_status DEFAULT 'pending',
    
    -- Quantities and prices
    quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
    filled_quantity DECIMAL(20, 8) DEFAULT 0,
    remaining_quantity DECIMAL(20, 8),
    
    -- Prices
    limit_price DECIMAL(20, 6), -- For limit orders
    stop_price DECIMAL(20, 6), -- For stop orders
    average_fill_price DECIMAL(20, 6),
    
    -- Amounts
    estimated_total DECIMAL(20, 2),
    filled_amount DECIMAL(20, 2) DEFAULT 0,
    commission DECIMAL(10, 2) DEFAULT 0,
    
    -- Order options
    time_in_force TEXT DEFAULT 'day' CHECK (time_in_force IN ('day', 'gtc', 'ioc', 'fok')), -- day, good till cancelled, immediate or cancel, fill or kill
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Related entities
    automation_rule_id UUID,
    parent_order_id UUID REFERENCES public.investment_orders(id), -- For split orders
    transaction_id UUID REFERENCES public.transactions(id), -- Link to completed transaction
    
    -- External references
    broker_order_id TEXT,
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order fills (partial fills tracking)
CREATE TABLE public.order_fills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.investment_orders(id) ON DELETE CASCADE,
    
    -- Fill details
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 6) NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    commission DECIMAL(10, 2) DEFAULT 0,
    
    -- External reference
    broker_fill_id TEXT,
    
    -- Timestamp
    filled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring investments
CREATE TABLE public.recurring_investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    
    -- Investment details
    name TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    frequency investment_frequency NOT NULL,
    
    -- Scheduling
    start_date DATE NOT NULL,
    end_date DATE,
    next_investment_date DATE NOT NULL,
    day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_paused BOOLEAN DEFAULT FALSE,
    pause_reason TEXT,
    
    -- Execution tracking
    total_invested DECIMAL(20, 2) DEFAULT 0,
    execution_count INTEGER DEFAULT 0,
    last_execution_date DATE,
    last_execution_status TEXT,
    failed_attempts INTEGER DEFAULT 0,
    
    -- Asset allocation
    allocation_strategy allocation_strategy DEFAULT 'equal_weight',
    asset_allocations JSONB DEFAULT '{}', -- {asset_id: percentage}
    
    -- Settings
    skip_weekends BOOLEAN DEFAULT TRUE,
    skip_holidays BOOLEAN DEFAULT TRUE,
    retry_failed BOOLEAN DEFAULT TRUE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction logs for detailed tracking
CREATE TABLE public.transaction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    
    -- Log details
    log_type TEXT NOT NULL CHECK (log_type IN ('status_change', 'amount_change', 'error', 'retry', 'webhook', 'system')),
    previous_status transaction_status,
    new_status transaction_status,
    
    -- Details
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    
    -- System info
    initiated_by UUID REFERENCES public.profiles(id),
    ip_address INET,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment methods for quick access
CREATE TABLE public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Method details
    method_type TEXT NOT NULL CHECK (method_type IN ('bank_account', 'debit_card', 'credit_card')),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- References
    bank_account_id UUID REFERENCES public.bank_accounts(id),
    
    -- Card details (encrypted)
    card_last_four TEXT,
    card_brand TEXT,
    card_exp_month INTEGER CHECK (card_exp_month >= 1 AND card_exp_month <= 12),
    card_exp_year INTEGER CHECK (card_exp_year >= 2024),
    
    -- Metadata
    nickname TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_portfolio_id ON public.transactions(portfolio_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_completed_at ON public.transactions(completed_at DESC) WHERE completed_at IS NOT NULL;

CREATE INDEX idx_investment_orders_user_id ON public.investment_orders(user_id);
CREATE INDEX idx_investment_orders_portfolio_id ON public.investment_orders(portfolio_id);
CREATE INDEX idx_investment_orders_asset_id ON public.investment_orders(asset_id);
CREATE INDEX idx_investment_orders_status ON public.investment_orders(status);
CREATE INDEX idx_investment_orders_type ON public.investment_orders(order_type, order_side);
CREATE INDEX idx_investment_orders_placed_at ON public.investment_orders(placed_at DESC);

CREATE INDEX idx_order_fills_order_id ON public.order_fills(order_id);
CREATE INDEX idx_order_fills_filled_at ON public.order_fills(filled_at DESC);

CREATE INDEX idx_recurring_investments_user_id ON public.recurring_investments(user_id);
CREATE INDEX idx_recurring_investments_portfolio_id ON public.recurring_investments(portfolio_id);
CREATE INDEX idx_recurring_investments_active ON public.recurring_investments(is_active, is_paused) WHERE is_active = TRUE AND is_paused = FALSE;
CREATE INDEX idx_recurring_investments_next_date ON public.recurring_investments(next_investment_date) WHERE is_active = TRUE;

CREATE INDEX idx_transaction_logs_transaction_id ON public.transaction_logs(transaction_id);
CREATE INDEX idx_transaction_logs_created_at ON public.transaction_logs(created_at DESC);

CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON public.payment_methods(user_id, is_default) WHERE is_default = TRUE;

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_fills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" 
    ON public.transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" 
    ON public.transactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users cannot update transactions" 
    ON public.transactions FOR UPDATE 
    USING (FALSE); -- Only system can update

CREATE POLICY "Admins can view all transactions" 
    ON public.transactions FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- RLS Policies for investment orders
CREATE POLICY "Users can manage own orders" 
    ON public.investment_orders FOR ALL 
    USING (auth.uid() = user_id);

-- RLS Policies for order fills
CREATE POLICY "Users can view fills for own orders" 
    ON public.order_fills FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.investment_orders 
        WHERE id = order_fills.order_id 
        AND user_id = auth.uid()
    ));

-- RLS Policies for recurring investments
CREATE POLICY "Users can manage own recurring investments" 
    ON public.recurring_investments FOR ALL 
    USING (auth.uid() = user_id);

-- RLS Policies for transaction logs
CREATE POLICY "Users can view logs for own transactions" 
    ON public.transaction_logs FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.transactions 
        WHERE id = transaction_logs.transaction_id 
        AND user_id = auth.uid()
    ));

CREATE POLICY "System can insert transaction logs" 
    ON public.transaction_logs FOR INSERT 
    WITH CHECK (TRUE);

-- RLS Policies for payment methods
CREATE POLICY "Users can manage own payment methods" 
    ON public.payment_methods FOR ALL 
    USING (auth.uid() = user_id);