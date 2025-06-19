-- Migration: 006_esg_and_impact
-- Description: Create ESG metrics, impact tracking, and sustainability tables

-- ESG metrics for assets
CREATE TABLE public.esg_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    
    -- Overall ESG scores
    total_score INTEGER CHECK (total_score >= 0 AND total_score <= 100),
    environmental_score INTEGER CHECK (environmental_score >= 0 AND environmental_score <= 100),
    social_score INTEGER CHECK (social_score >= 0 AND social_score <= 100),
    governance_score INTEGER CHECK (governance_score >= 0 AND governance_score <= 100),
    
    -- Environmental metrics
    carbon_footprint DECIMAL(15, 2), -- tons CO2e per million revenue
    carbon_intensity DECIMAL(15, 2), -- tons CO2e per unit
    renewable_energy_percentage DECIMAL(5, 2) CHECK (renewable_energy_percentage >= 0 AND renewable_energy_percentage <= 100),
    water_usage DECIMAL(15, 2), -- cubic meters per million revenue
    waste_recycling_percentage DECIMAL(5, 2) CHECK (waste_recycling_percentage >= 0 AND waste_recycling_percentage <= 100),
    
    -- Social metrics
    diversity_score DECIMAL(5, 2) CHECK (diversity_score >= 0 AND diversity_score <= 100),
    employee_satisfaction_score DECIMAL(5, 2) CHECK (employee_satisfaction_score >= 0 AND employee_satisfaction_score <= 100),
    community_impact_score DECIMAL(5, 2) CHECK (community_impact_score >= 0 AND community_impact_score <= 100),
    human_rights_score DECIMAL(5, 2) CHECK (human_rights_score >= 0 AND human_rights_score <= 100),
    data_privacy_score DECIMAL(5, 2) CHECK (data_privacy_score >= 0 AND data_privacy_score <= 100),
    
    -- Governance metrics
    board_diversity_percentage DECIMAL(5, 2) CHECK (board_diversity_percentage >= 0 AND board_diversity_percentage <= 100),
    executive_compensation_ratio DECIMAL(10, 2),
    transparency_score DECIMAL(5, 2) CHECK (transparency_score >= 0 AND transparency_score <= 100),
    ethics_score DECIMAL(5, 2) CHECK (ethics_score >= 0 AND ethics_score <= 100),
    shareholder_rights_score DECIMAL(5, 2) CHECK (shareholder_rights_score >= 0 AND shareholder_rights_score <= 100),
    
    -- Controversies and risks
    controversy_score INTEGER CHECK (controversy_score >= 0 AND controversy_score <= 10), -- 0 = no controversies, 10 = severe
    controversy_details JSONB DEFAULT '[]',
    esg_risk_level TEXT CHECK (esg_risk_level IN ('negligible', 'low', 'medium', 'high', 'severe')),
    
    -- Data source and quality
    data_provider TEXT,
    data_quality_score DECIMAL(5, 2) CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Additional metadata
    certifications JSONB DEFAULT '[]', -- Array of certifications
    un_sdg_alignment JSONB DEFAULT '{}', -- UN Sustainable Development Goals alignment
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one set of metrics per asset
    UNIQUE(asset_id)
);

-- Impact tracking for portfolios
CREATE TABLE public.impact_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    
    -- Tracking period
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    period_type TEXT DEFAULT 'daily' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    
    -- Portfolio ESG metrics
    esg_score INTEGER,
    environmental_score INTEGER,
    social_score INTEGER,
    governance_score INTEGER,
    
    -- Environmental impact
    carbon_footprint DECIMAL(15, 2),
    carbon_offset DECIMAL(15, 2),
    net_carbon_impact DECIMAL(15, 2),
    renewable_exposure DECIMAL(5, 2), -- Percentage
    green_revenue_percentage DECIMAL(5, 2),
    
    -- Social impact
    social_impact INTEGER,
    jobs_supported INTEGER,
    community_investment DECIMAL(15, 2),
    
    -- Financial metrics
    total_value DECIMAL(20, 2),
    esg_aligned_value DECIMAL(20, 2), -- Value in ESG-rated assets
    esg_aligned_percentage DECIMAL(5, 2),
    
    -- Holdings snapshot
    holdings_count INTEGER,
    avg_esg_score DECIMAL(5, 2),
    top_esg_holdings JSONB, -- Array of top ESG performers
    bottom_esg_holdings JSONB, -- Array of bottom ESG performers
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Impact metrics (user-level aggregated impact)
CREATE TABLE public.impact_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
    
    -- Metric details
    metric_type TEXT NOT NULL CHECK (metric_type IN (
        'carbon_offset', 'renewable_energy', 'water_saved', 'trees_planted',
        'jobs_created', 'education_funded', 'healthcare_provided', 'poverty_alleviation',
        'gender_equality', 'clean_energy', 'sustainable_cities', 'responsible_consumption'
    )),
    
    -- Values
    value DECIMAL(20, 4) NOT NULL,
    unit TEXT NOT NULL,
    description TEXT,
    
    -- Period
    date DATE NOT NULL,
    period_type TEXT DEFAULT 'monthly' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    
    -- Calculation details
    calculation_method TEXT,
    data_sources JSONB DEFAULT '[]',
    confidence_level DECIMAL(5, 2) CHECK (confidence_level >= 0 AND confidence_level <= 100),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ESG goals and targets
CREATE TABLE public.esg_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Goal details
    goal_type TEXT NOT NULL CHECK (goal_type IN (
        'portfolio_esg_score', 'carbon_neutral', 'renewable_percentage',
        'social_impact', 'diversity_target', 'sustainable_investing'
    )),
    title TEXT NOT NULL,
    description TEXT,
    
    -- Target values
    target_value DECIMAL(15, 2) NOT NULL,
    current_value DECIMAL(15, 2) DEFAULT 0,
    unit TEXT,
    
    -- Timeline
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    
    -- Progress tracking
    progress_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    is_achieved BOOLEAN DEFAULT FALSE,
    achieved_date DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    
    -- Related portfolio
    portfolio_id UUID REFERENCES public.portfolios(id),
    
    -- Milestones
    milestones JSONB DEFAULT '[]', -- Array of {value, date, description}
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ESG recommendations (specific to ESG improvement)
CREATE TABLE public.esg_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
    
    -- Recommendation details
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('improve', 'divest', 'invest', 'rebalance')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Target asset
    asset_id UUID REFERENCES public.assets(id),
    asset_symbol TEXT,
    asset_name TEXT,
    
    -- Recommendation content
    title TEXT NOT NULL,
    reason TEXT NOT NULL,
    detailed_analysis TEXT,
    
    -- Impact estimates
    potential_esg_impact INTEGER, -- Points improvement
    potential_carbon_reduction DECIMAL(15, 2),
    potential_social_impact INTEGER,
    
    -- Suggested action
    action_type TEXT CHECK (action_type IN ('buy', 'sell', 'hold', 'increase', 'decrease')),
    suggested_amount DECIMAL(15, 2),
    suggested_percentage DECIMAL(5, 2),
    
    -- Alternative suggestions
    alternative_assets JSONB DEFAULT '[]', -- Array of alternative asset suggestions
    
    -- User interaction
    is_viewed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    is_implemented BOOLEAN DEFAULT FALSE,
    implemented_at TIMESTAMP WITH TIME ZONE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    dismissal_reason TEXT,
    
    -- Validity
    valid_until DATE,
    confidence_score DECIMAL(5, 2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    
    -- Metadata
    data_sources JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ESG certifications and badges
CREATE TABLE public.esg_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Certification details
    name TEXT UNIQUE NOT NULL,
    issuer TEXT NOT NULL,
    description TEXT,
    
    -- Requirements
    requirements JSONB NOT NULL, -- Array of requirements
    
    -- Visual elements
    badge_url TEXT,
    icon TEXT,
    color TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User ESG certifications earned
CREATE TABLE public.user_esg_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    certification_id UUID NOT NULL REFERENCES public.esg_certifications(id),
    portfolio_id UUID REFERENCES public.portfolios(id),
    
    -- Achievement details
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Verification
    is_verified BOOLEAN DEFAULT TRUE,
    verification_data JSONB DEFAULT '{}',
    
    -- Display
    is_displayed BOOLEAN DEFAULT TRUE,
    display_order INTEGER,
    
    UNIQUE(user_id, certification_id)
);

-- Create indexes
CREATE INDEX idx_esg_metrics_asset_id ON public.esg_metrics(asset_id);
CREATE INDEX idx_esg_metrics_total_score ON public.esg_metrics(total_score DESC);
CREATE INDEX idx_esg_metrics_updated ON public.esg_metrics(last_updated DESC);

CREATE INDEX idx_impact_tracking_portfolio_id ON public.impact_tracking(portfolio_id);
CREATE INDEX idx_impact_tracking_recorded_at ON public.impact_tracking(portfolio_id, recorded_at DESC);
CREATE INDEX idx_impact_tracking_period ON public.impact_tracking(portfolio_id, period_type, recorded_at DESC);

CREATE INDEX idx_impact_metrics_user_id ON public.impact_metrics(user_id);
CREATE INDEX idx_impact_metrics_portfolio_id ON public.impact_metrics(portfolio_id);
CREATE INDEX idx_impact_metrics_type ON public.impact_metrics(metric_type);
CREATE INDEX idx_impact_metrics_date ON public.impact_metrics(date DESC);

CREATE INDEX idx_esg_goals_user_id ON public.esg_goals(user_id);
CREATE INDEX idx_esg_goals_active ON public.esg_goals(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_esg_goals_type ON public.esg_goals(goal_type);

CREATE INDEX idx_esg_recommendations_user_id ON public.esg_recommendations(user_id);
CREATE INDEX idx_esg_recommendations_portfolio_id ON public.esg_recommendations(portfolio_id);
CREATE INDEX idx_esg_recommendations_unviewed ON public.esg_recommendations(user_id, is_viewed) WHERE is_viewed = FALSE;
CREATE INDEX idx_esg_recommendations_valid ON public.esg_recommendations(valid_until) WHERE valid_until > CURRENT_DATE;

CREATE INDEX idx_user_esg_certifications_user_id ON public.user_esg_certifications(user_id);
CREATE INDEX idx_user_esg_certifications_displayed ON public.user_esg_certifications(user_id, is_displayed) WHERE is_displayed = TRUE;

-- Enable Row Level Security
ALTER TABLE public.esg_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_esg_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ESG metrics (public read)
CREATE POLICY "Anyone can view ESG metrics" 
    ON public.esg_metrics FOR SELECT 
    USING (TRUE);

CREATE POLICY "System can manage ESG metrics" 
    ON public.esg_metrics FOR ALL 
    USING (TRUE);

-- RLS Policies for impact tracking
CREATE POLICY "Users can view impact tracking for own portfolios" 
    ON public.impact_tracking FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE id = impact_tracking.portfolio_id 
        AND (user_id = auth.uid() OR is_public = TRUE)
    ));

CREATE POLICY "System can manage impact tracking" 
    ON public.impact_tracking FOR ALL 
    USING (TRUE);

-- RLS Policies for impact metrics
CREATE POLICY "Users can view own impact metrics" 
    ON public.impact_metrics FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage impact metrics" 
    ON public.impact_metrics FOR ALL 
    USING (TRUE);

-- RLS Policies for ESG goals
CREATE POLICY "Users can manage own ESG goals" 
    ON public.esg_goals FOR ALL 
    USING (auth.uid() = user_id);

-- RLS Policies for ESG recommendations
CREATE POLICY "Users can view own ESG recommendations" 
    ON public.esg_recommendations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own ESG recommendations" 
    ON public.esg_recommendations FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "System can create ESG recommendations" 
    ON public.esg_recommendations FOR INSERT 
    WITH CHECK (TRUE);

-- RLS Policies for ESG certifications (public read)
CREATE POLICY "Anyone can view ESG certifications" 
    ON public.esg_certifications FOR SELECT 
    USING (TRUE);

CREATE POLICY "Admins can manage ESG certifications" 
    ON public.esg_certifications FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ));

-- RLS Policies for user ESG certifications
CREATE POLICY "Users can view own ESG certifications" 
    ON public.user_esg_certifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Public can view displayed certifications" 
    ON public.user_esg_certifications FOR SELECT 
    USING (is_displayed = TRUE);

CREATE POLICY "System can manage user certifications" 
    ON public.user_esg_certifications FOR ALL 
    USING (TRUE);