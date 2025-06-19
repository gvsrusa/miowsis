-- Migration: 002_auth_and_profiles
-- Description: Create user profiles and authentication related tables

-- Users profile table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    date_of_birth DATE,
    
    -- Role and status
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- KYC information
    kyc_status kyc_status DEFAULT 'pending',
    kyc_submitted_at TIMESTAMP WITH TIME ZONE,
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    kyc_rejected_at TIMESTAMP WITH TIME ZONE,
    kyc_rejection_reason TEXT,
    kyc_expiry_date DATE,
    
    -- Onboarding and preferences
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 1,
    risk_profile JSONB DEFAULT '{}',
    investment_goals JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    
    -- Subscription and limits
    subscription_tier TEXT DEFAULT 'basic',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    daily_investment_limit DECIMAL(15, 2) DEFAULT 10000.00,
    monthly_investment_limit DECIMAL(15, 2) DEFAULT 50000.00,
    
    -- Metadata
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE DEFAULT gen_random_uuid()::text,
    referred_by UUID REFERENCES public.profiles(id),
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KYC Documents table
CREATE TABLE public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('passport', 'drivers_license', 'national_id', 'proof_of_address', 'bank_statement', 'tax_document')),
    document_number TEXT,
    document_url TEXT NOT NULL,
    document_back_url TEXT, -- For documents with two sides
    
    -- Verification details
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES public.profiles(id),
    rejection_reason TEXT,
    
    -- Document metadata
    issuing_country TEXT,
    issue_date DATE,
    expiry_date DATE,
    metadata JSONB DEFAULT '{}',
    
    -- Security
    is_encrypted BOOLEAN DEFAULT TRUE,
    checksum TEXT, -- For integrity verification
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Accounts table with enhanced security
CREATE TABLE public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Account information (encrypted)
    account_name TEXT NOT NULL,
    account_number_encrypted TEXT NOT NULL, -- Encrypted
    routing_number_encrypted TEXT NOT NULL, -- Encrypted
    account_type TEXT DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings')),
    bank_name TEXT NOT NULL,
    bank_code TEXT,
    swift_code TEXT,
    
    -- Status and verification
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    verification_method TEXT CHECK (verification_method IN ('micro_deposit', 'plaid', 'manual')),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Plaid integration (if used)
    plaid_account_id TEXT,
    plaid_access_token_encrypted TEXT, -- Encrypted
    plaid_item_id TEXT,
    
    -- Limits and metadata
    daily_limit DECIMAL(15, 2),
    monthly_limit DECIMAL(15, 2),
    last_used_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions for activity tracking
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    
    -- Session details
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    location JSONB DEFAULT '{}',
    
    -- Activity
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Security
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    is_suspicious BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for compliance
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Action details
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id UUID REFERENCES public.user_sessions(id),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;
CREATE INDEX idx_profiles_kyc_status ON public.profiles(kyc_status);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at DESC);

CREATE INDEX idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX idx_kyc_documents_status ON public.kyc_documents(status);
CREATE INDEX idx_kyc_documents_type ON public.kyc_documents(document_type);

CREATE INDEX idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_primary ON public.bank_accounts(user_id, is_primary) WHERE is_primary = TRUE;

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(user_id, is_active) WHERE is_active = TRUE;

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role != 'admin'); -- Prevent self-promotion to admin

CREATE POLICY "Admins can view all profiles" 
    ON public.profiles FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- RLS Policies for KYC documents
CREATE POLICY "Users can view own KYC documents" 
    ON public.kyc_documents FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC documents" 
    ON public.kyc_documents FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending KYC documents" 
    ON public.kyc_documents FOR UPDATE 
    USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all KYC documents" 
    ON public.kyc_documents FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    ));

-- RLS Policies for bank accounts
CREATE POLICY "Users can view own bank accounts" 
    ON public.bank_accounts FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bank accounts" 
    ON public.bank_accounts FOR ALL 
    USING (auth.uid() = user_id);

-- RLS Policies for user sessions
CREATE POLICY "Users can view own sessions" 
    ON public.user_sessions FOR SELECT 
    USING (auth.uid() = user_id);

-- RLS Policies for audit logs
CREATE POLICY "Users can view own audit logs" 
    ON public.audit_logs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" 
    ON public.audit_logs FOR INSERT 
    WITH CHECK (TRUE); -- Allow system to log all actions

CREATE POLICY "Admins can view all audit logs" 
    ON public.audit_logs FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ));