-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE kyc_status AS ENUM ('pending', 'in_progress', 'verified', 'rejected');
CREATE TYPE investment_status AS ENUM ('pending', 'executed', 'cancelled', 'failed');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'investment', 'dividend', 'fee');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    kyc_status kyc_status DEFAULT 'pending',
    kyc_completed_at TIMESTAMP WITH TIME ZONE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    risk_profile JSONB,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KYC Documents
CREATE TABLE public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    verified_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Accounts
CREATE TABLE public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    routing_number TEXT NOT NULL,
    bank_name TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolios
CREATE TABLE public.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    total_value DECIMAL(15, 2) DEFAULT 0,
    total_invested DECIMAL(15, 2) DEFAULT 0,
    total_returns DECIMAL(15, 2) DEFAULT 0,
    risk_score INTEGER CHECK (risk_score >= 1 AND risk_score <= 10),
    esg_score INTEGER CHECK (esg_score >= 0 AND esg_score <= 100),
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets (Stocks, ETFs, etc.)
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    current_price DECIMAL(10, 2),
    market_cap BIGINT,
    sector TEXT,
    industry TEXT,
    esg_scores JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio Holdings
CREATE TABLE public.holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id),
    quantity DECIMAL(15, 6) NOT NULL,
    average_cost DECIMAL(10, 2) NOT NULL,
    current_value DECIMAL(15, 2),
    unrealized_pnl DECIMAL(15, 2),
    percentage DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, asset_id)
);

-- Transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE SET NULL,
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status investment_status DEFAULT 'pending',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investment Orders
CREATE TABLE public.investment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id),
    order_type TEXT NOT NULL, -- 'buy' or 'sell'
    quantity DECIMAL(15, 6) NOT NULL,
    price DECIMAL(10, 2),
    total_amount DECIMAL(15, 2) NOT NULL,
    status investment_status DEFAULT 'pending',
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Investments
CREATE TABLE public.recurring_investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    next_investment_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ESG Impact Tracking
CREATE TABLE public.impact_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    unit TEXT,
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements & Gamification
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    points INTEGER DEFAULT 0,
    criteria JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX idx_holdings_portfolio_id ON public.holdings(portfolio_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_investment_orders_user_id ON public.investment_orders(user_id);
CREATE INDEX idx_investment_orders_status ON public.investment_orders(status);
CREATE INDEX idx_notifications_user_id_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own portfolios" ON public.portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own portfolios" ON public.portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolios" ON public.portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holdings_updated_at BEFORE UPDATE ON public.holdings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();