-- Migration: 007_gamification_achievements
-- Description: Create gamification, achievements, user progress, and social features

-- Achievements master table
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Achievement details
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    detailed_description TEXT,
    
    -- Categorization
    category achievement_category NOT NULL,
    rarity achievement_rarity NOT NULL,
    
    -- Visual elements
    icon TEXT NOT NULL,
    icon_url TEXT,
    badge_color TEXT,
    animation_type TEXT,
    
    -- Points and rewards
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    xp_reward INTEGER DEFAULT 0 CHECK (xp_reward >= 0),
    
    -- Requirements
    criteria JSONB NOT NULL, -- {type, value, condition}
    prerequisite_achievements UUID[], -- Array of achievement IDs that must be completed first
    
    -- Tracking
    is_active BOOLEAN DEFAULT TRUE,
    is_hidden BOOLEAN DEFAULT FALSE, -- Hidden until certain conditions are met
    is_seasonal BOOLEAN DEFAULT FALSE,
    season_start DATE,
    season_end DATE,
    
    -- Statistics
    total_unlocks INTEGER DEFAULT 0,
    unlock_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements (unlocked achievements)
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id),
    
    -- Unlock details
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlock_trigger TEXT, -- What triggered the unlock
    
    -- Progress tracking (for progressive achievements)
    progress DECIMAL(5, 2) DEFAULT 100 CHECK (progress >= 0 AND progress <= 100),
    progress_data JSONB DEFAULT '{}',
    
    -- Display preferences
    is_featured BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    
    -- Social
    is_shared BOOLEAN DEFAULT FALSE,
    shared_at TIMESTAMP WITH TIME ZONE,
    share_count INTEGER DEFAULT 0,
    
    UNIQUE(user_id, achievement_id)
);

-- User progress and levels
CREATE TABLE public.user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Points and levels
    total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
    total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    level_progress DECIMAL(5, 2) DEFAULT 0 CHECK (level_progress >= 0 AND level_progress <= 100),
    
    -- Streaks
    investment_streak INTEGER DEFAULT 0,
    login_streak INTEGER DEFAULT 0,
    last_investment_date DATE,
    last_login_date DATE,
    longest_investment_streak INTEGER DEFAULT 0,
    longest_login_streak INTEGER DEFAULT 0,
    
    -- Activity metrics
    total_investments INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    portfolios_created INTEGER DEFAULT 0,
    goals_completed INTEGER DEFAULT 0,
    
    -- Educational progress
    tutorials_completed INTEGER DEFAULT 0,
    articles_read INTEGER DEFAULT 0,
    videos_watched INTEGER DEFAULT 0,
    quizzes_passed INTEGER DEFAULT 0,
    
    -- Social metrics
    referrals_made INTEGER DEFAULT 0,
    community_posts INTEGER DEFAULT 0,
    helpful_votes_received INTEGER DEFAULT 0,
    
    -- Rankings
    global_rank INTEGER,
    country_rank INTEGER,
    weekly_rank INTEGER,
    
    -- Titles and badges
    current_title TEXT,
    unlocked_titles TEXT[] DEFAULT '{}',
    featured_badges UUID[] DEFAULT '{}', -- Array of achievement IDs to display
    
    -- Statistics
    statistics JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboards
CREATE TABLE public.leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Leaderboard details
    name TEXT NOT NULL,
    leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('global', 'country', 'friends', 'portfolio_value', 'returns', 'esg_impact', 'achievements')),
    time_period TEXT NOT NULL CHECK (time_period IN ('all_time', 'yearly', 'monthly', 'weekly', 'daily')),
    
    -- Configuration
    min_participants INTEGER DEFAULT 10,
    max_participants INTEGER DEFAULT 1000,
    update_frequency TEXT DEFAULT 'hourly',
    
    -- Filters
    country_code TEXT,
    category TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_updated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(leaderboard_type, time_period, country_code)
);

-- Leaderboard entries
CREATE TABLE public.leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leaderboard_id UUID NOT NULL REFERENCES public.leaderboards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Ranking
    rank INTEGER NOT NULL,
    previous_rank INTEGER,
    rank_change INTEGER DEFAULT 0,
    
    -- Score
    score DECIMAL(20, 4) NOT NULL,
    previous_score DECIMAL(20, 4),
    score_change DECIMAL(20, 4) DEFAULT 0,
    
    -- Additional metrics
    metric_value DECIMAL(20, 4),
    metric_type TEXT,
    
    -- Metadata
    display_name TEXT,
    avatar_url TEXT,
    country_code TEXT,
    
    -- Timestamps
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(leaderboard_id, user_id, period_start)
);

-- Challenges and quests
CREATE TABLE public.challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Challenge details
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'special', 'community')),
    
    -- Requirements
    requirements JSONB NOT NULL, -- Array of requirements
    
    -- Rewards
    point_reward INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 0,
    achievement_id UUID REFERENCES public.achievements(id),
    additional_rewards JSONB DEFAULT '{}',
    
    -- Timing
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Participation
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    completion_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User challenge progress
CREATE TABLE public.user_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id),
    
    -- Progress
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'abandoned')),
    progress DECIMAL(5, 2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    progress_data JSONB DEFAULT '{}',
    
    -- Completion
    completed_at TIMESTAMP WITH TIME ZONE,
    time_to_complete INTERVAL,
    
    -- Rewards claimed
    rewards_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_progress_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, challenge_id)
);

-- Badges (visual achievements)
CREATE TABLE public.badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Badge details
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    tier INTEGER DEFAULT 1 CHECK (tier >= 1 AND tier <= 5),
    
    -- Visual design
    design_url TEXT,
    icon TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    shape TEXT DEFAULT 'circle' CHECK (shape IN ('circle', 'square', 'hexagon', 'shield', 'star')),
    
    -- Requirements
    required_achievements UUID[], -- Achievement IDs required
    required_points INTEGER,
    required_level INTEGER,
    
    -- Special conditions
    is_limited_edition BOOLEAN DEFAULT FALSE,
    edition_size INTEGER,
    current_holders INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id),
    
    -- Award details
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    award_reason TEXT,
    
    -- Display
    is_displayed BOOLEAN DEFAULT TRUE,
    display_order INTEGER,
    
    -- For limited edition badges
    edition_number INTEGER,
    
    UNIQUE(user_id, badge_id)
);

-- Notifications table (moved from original schema with enhancements)
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Notification content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    category TEXT CHECK (category IN ('transaction', 'achievement', 'market', 'social', 'system', 'education')),
    
    -- Priority and urgency
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Actions
    action_type TEXT CHECK (action_type IN ('view', 'navigate', 'external_link', 'dismiss')),
    action_url TEXT,
    action_data JSONB DEFAULT '{}',
    
    -- Related entities
    related_entity_type TEXT,
    related_entity_id UUID,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery channels
    channels JSONB DEFAULT '["in_app"]', -- ["in_app", "email", "push", "sms"]
    email_sent BOOLEAN DEFAULT FALSE,
    push_sent BOOLEAN DEFAULT FALSE,
    sms_sent BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_achievements_category ON public.achievements(category);
CREATE INDEX idx_achievements_rarity ON public.achievements(rarity);
CREATE INDEX idx_achievements_active ON public.achievements(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_unlocked_at ON public.user_achievements(unlocked_at DESC);
CREATE INDEX idx_user_achievements_featured ON public.user_achievements(user_id, is_featured) WHERE is_featured = TRUE;

CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_level ON public.user_progress(level DESC);
CREATE INDEX idx_user_progress_points ON public.user_progress(total_points DESC);
CREATE INDEX idx_user_progress_streaks ON public.user_progress(investment_streak DESC);

CREATE INDEX idx_leaderboard_entries_leaderboard_id ON public.leaderboard_entries(leaderboard_id);
CREATE INDEX idx_leaderboard_entries_user_id ON public.leaderboard_entries(user_id);
CREATE INDEX idx_leaderboard_entries_rank ON public.leaderboard_entries(leaderboard_id, rank);

CREATE INDEX idx_challenges_type ON public.challenges(challenge_type);
CREATE INDEX idx_challenges_active ON public.challenges(is_active, start_date, end_date);

CREATE INDEX idx_user_challenges_user_id ON public.user_challenges(user_id);
CREATE INDEX idx_user_challenges_status ON public.user_challenges(status);

CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_displayed ON public.user_badges(user_id, is_displayed) WHERE is_displayed = TRUE;

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view active achievements" 
    ON public.achievements FOR SELECT 
    USING (is_active = TRUE AND is_hidden = FALSE);

CREATE POLICY "Users can view hidden achievements they've unlocked" 
    ON public.achievements FOR SELECT 
    USING (is_hidden = TRUE AND EXISTS (
        SELECT 1 FROM public.user_achievements 
        WHERE achievement_id = achievements.id 
        AND user_id = auth.uid()
    ));

-- RLS Policies for user achievements
CREATE POLICY "Users can view own achievements" 
    ON public.user_achievements FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view featured achievements of others" 
    ON public.user_achievements FOR SELECT 
    USING (is_featured = TRUE AND is_hidden = FALSE);

CREATE POLICY "System can manage user achievements" 
    ON public.user_achievements FOR ALL 
    USING (TRUE);

-- RLS Policies for user progress
CREATE POLICY "Users can view own progress" 
    ON public.user_progress FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view basic progress of others" 
    ON public.user_progress FOR SELECT 
    USING (TRUE); -- Allow viewing level, points for leaderboards

CREATE POLICY "System can manage user progress" 
    ON public.user_progress FOR ALL 
    USING (TRUE);

-- RLS Policies for leaderboards (public read)
CREATE POLICY "Anyone can view active leaderboards" 
    ON public.leaderboards FOR SELECT 
    USING (is_active = TRUE);

-- RLS Policies for leaderboard entries
CREATE POLICY "Anyone can view leaderboard entries" 
    ON public.leaderboard_entries FOR SELECT 
    USING (TRUE);

CREATE POLICY "System can manage leaderboard entries" 
    ON public.leaderboard_entries FOR ALL 
    USING (TRUE);

-- RLS Policies for challenges
CREATE POLICY "Anyone can view active challenges" 
    ON public.challenges FOR SELECT 
    USING (is_active = TRUE AND start_date <= NOW() AND end_date >= NOW());

-- RLS Policies for user challenges
CREATE POLICY "Users can view own challenge progress" 
    ON public.user_challenges FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own challenges" 
    ON public.user_challenges FOR ALL 
    USING (auth.uid() = user_id);

-- RLS Policies for badges (public read)
CREATE POLICY "Anyone can view badges" 
    ON public.badges FOR SELECT 
    USING (TRUE);

-- RLS Policies for user badges
CREATE POLICY "Users can view own badges" 
    ON public.user_badges FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view displayed badges" 
    ON public.user_badges FOR SELECT 
    USING (is_displayed = TRUE);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
    ON public.notifications FOR INSERT 
    WITH CHECK (TRUE);