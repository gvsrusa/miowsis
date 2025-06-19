-- Migration: 008_functions_and_triggers
-- Description: Create database functions, triggers, and stored procedures

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    -- Generate 8 character code
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USER AND PROFILE FUNCTIONS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    referral_code TEXT;
BEGIN
    -- Generate unique referral code
    LOOP
        referral_code := generate_referral_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = referral_code);
    END LOOP;
    
    -- Insert profile
    INSERT INTO public.profiles (id, email, referral_code)
    VALUES (NEW.id, NEW.email, referral_code);
    
    -- Initialize user progress
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id);
    
    -- Create welcome notification
    INSERT INTO public.notifications (user_id, title, message, type, category)
    VALUES (
        NEW.id,
        'Welcome to MIOwSIS!',
        'Start your sustainable investment journey today. Complete your profile to get personalized recommendations.',
        'info',
        'system'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user level from XP
CREATE OR REPLACE FUNCTION public.calculate_user_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Level calculation: level = floor(sqrt(xp / 100)) + 1
    RETURN FLOOR(SQRT(xp::FLOAT / 100)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate XP needed for next level
CREATE OR REPLACE FUNCTION public.xp_for_level(level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- XP needed: 100 * (level - 1)^2
    RETURN 100 * POWER(level - 1, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- PORTFOLIO FUNCTIONS
-- =====================================================

-- Function to calculate portfolio metrics
CREATE OR REPLACE FUNCTION public.calculate_portfolio_metrics(p_portfolio_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_value DECIMAL(20, 2) := 0;
    v_total_invested DECIMAL(20, 2) := 0;
    v_total_returns DECIMAL(20, 2) := 0;
    v_holdings_count INTEGER := 0;
    v_weighted_esg_score DECIMAL(10, 2) := 0;
    v_cash_balance DECIMAL(20, 2);
BEGIN
    -- Get cash balance
    SELECT COALESCE(cash_balance, 0) INTO v_cash_balance
    FROM public.portfolios
    WHERE id = p_portfolio_id;
    
    -- Calculate holdings metrics
    SELECT 
        COALESCE(SUM(h.quantity * a.current_price), 0),
        COALESCE(SUM(h.total_invested), 0),
        COUNT(h.id),
        COALESCE(SUM(CASE 
            WHEN a.current_price > 0 AND em.total_score IS NOT NULL 
            THEN (h.quantity * a.current_price) * em.total_score 
            ELSE 0 
        END) / NULLIF(SUM(h.quantity * a.current_price), 0), 0)
    INTO v_total_value, v_total_invested, v_holdings_count, v_weighted_esg_score
    FROM public.holdings h
    JOIN public.assets a ON h.asset_id = a.id
    LEFT JOIN public.esg_metrics em ON a.id = em.asset_id
    WHERE h.portfolio_id = p_portfolio_id;
    
    -- Add cash to total value
    v_total_value := v_total_value + v_cash_balance;
    
    -- Calculate returns
    v_total_returns := v_total_value - v_total_invested;
    
    -- Update portfolio
    UPDATE public.portfolios
    SET 
        total_value = v_total_value,
        total_invested = v_total_invested,
        total_returns = v_total_returns,
        total_returns_percentage = CASE 
            WHEN v_total_invested > 0 THEN (v_total_returns / v_total_invested) * 100 
            ELSE 0 
        END,
        esg_score = ROUND(v_weighted_esg_score),
        last_calculated_at = NOW()
    WHERE id = p_portfolio_id;
    
    -- Update holdings percentages
    UPDATE public.holdings h
    SET 
        portfolio_percentage = CASE 
            WHEN v_total_value > 0 THEN (h.current_value / v_total_value) * 100 
            ELSE 0 
        END,
        current_value = h.quantity * a.current_price,
        unrealized_pnl = (h.quantity * a.current_price) - h.total_invested,
        unrealized_pnl_percentage = CASE 
            WHEN h.total_invested > 0 
            THEN (((h.quantity * a.current_price) - h.total_invested) / h.total_invested) * 100 
            ELSE 0 
        END
    FROM public.assets a
    WHERE h.asset_id = a.id 
    AND h.portfolio_id = p_portfolio_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record portfolio performance snapshot
CREATE OR REPLACE FUNCTION public.record_portfolio_performance()
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.portfolio_performance_history (
        portfolio_id,
        date,
        total_value,
        total_invested,
        total_returns,
        total_returns_percentage,
        holdings_count,
        volatility
    )
    SELECT 
        id,
        CURRENT_DATE,
        total_value,
        total_invested,
        total_returns,
        total_returns_percentage,
        (SELECT COUNT(*) FROM public.holdings WHERE portfolio_id = portfolios.id),
        volatility
    FROM public.portfolios
    WHERE is_active = TRUE
    ON CONFLICT (portfolio_id, date) 
    DO UPDATE SET
        total_value = EXCLUDED.total_value,
        total_invested = EXCLUDED.total_invested,
        total_returns = EXCLUDED.total_returns,
        total_returns_percentage = EXCLUDED.total_returns_percentage,
        holdings_count = EXCLUDED.holdings_count,
        volatility = EXCLUDED.volatility;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRANSACTION FUNCTIONS
-- =====================================================

-- Function to process transaction fees
CREATE OR REPLACE FUNCTION public.calculate_transaction_fee(
    p_amount DECIMAL(20, 2),
    p_transaction_type transaction_type
) RETURNS DECIMAL(10, 2) AS $$
DECLARE
    v_fee_rate DECIMAL(5, 4);
    v_min_fee DECIMAL(10, 2);
    v_max_fee DECIMAL(10, 2);
BEGIN
    -- Set fee rates based on transaction type
    CASE p_transaction_type
        WHEN 'buy', 'sell' THEN
            v_fee_rate := 0.001; -- 0.1%
            v_min_fee := 0.01;
            v_max_fee := 10.00;
        WHEN 'deposit', 'withdrawal' THEN
            v_fee_rate := 0.0;
            v_min_fee := 0.0;
            v_max_fee := 0.0;
        ELSE
            v_fee_rate := 0.0;
            v_min_fee := 0.0;
            v_max_fee := 0.0;
    END CASE;
    
    -- Calculate fee
    RETURN LEAST(GREATEST(p_amount * v_fee_rate, v_min_fee), v_max_fee);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate transaction
CREATE OR REPLACE FUNCTION public.validate_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_user_balance DECIMAL(20, 2);
    v_holding_quantity DECIMAL(20, 8);
BEGIN
    -- Validate buy transactions
    IF NEW.transaction_type = 'buy' THEN
        -- Check user has sufficient funds
        SELECT cash_balance INTO v_user_balance
        FROM public.portfolios
        WHERE id = NEW.portfolio_id;
        
        IF v_user_balance < (NEW.amount + NEW.fee) THEN
            RAISE EXCEPTION 'Insufficient funds for transaction';
        END IF;
    END IF;
    
    -- Validate sell transactions
    IF NEW.transaction_type = 'sell' THEN
        -- Check user has sufficient holdings
        SELECT quantity INTO v_holding_quantity
        FROM public.holdings
        WHERE portfolio_id = NEW.portfolio_id 
        AND asset_id = NEW.asset_id;
        
        IF v_holding_quantity IS NULL OR v_holding_quantity < NEW.quantity THEN
            RAISE EXCEPTION 'Insufficient holdings for sell transaction';
        END IF;
    END IF;
    
    -- Calculate net amount
    NEW.net_amount := NEW.amount - NEW.fee - COALESCE(NEW.tax, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ACHIEVEMENT FUNCTIONS
-- =====================================================

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id UUID)
RETURNS TABLE(achievement_id UUID, achievement_name TEXT, points INTEGER) AS $$
DECLARE
    v_user_stats RECORD;
    v_achievement RECORD;
    v_newly_unlocked UUID[] := '{}';
BEGIN
    -- Get user stats
    SELECT 
        up.*,
        (SELECT COUNT(*) FROM public.transactions WHERE user_id = p_user_id AND status = 'completed') as transaction_count,
        (SELECT COUNT(DISTINCT asset_id) FROM public.holdings h 
         JOIN public.portfolios p ON h.portfolio_id = p.id 
         WHERE p.user_id = p_user_id) as unique_holdings,
        (SELECT COALESCE(SUM(total_invested), 0) FROM public.portfolios WHERE user_id = p_user_id) as total_invested,
        (SELECT COALESCE(AVG(esg_score), 0) FROM public.portfolios WHERE user_id = p_user_id) as avg_esg_score
    INTO v_user_stats
    FROM public.user_progress up
    WHERE up.user_id = p_user_id;
    
    -- Check each achievement
    FOR v_achievement IN 
        SELECT a.* 
        FROM public.achievements a
        WHERE a.is_active = TRUE
        AND NOT EXISTS (
            SELECT 1 FROM public.user_achievements ua 
            WHERE ua.user_id = p_user_id 
            AND ua.achievement_id = a.id
        )
    LOOP
        -- Check if criteria is met based on achievement type
        IF check_achievement_criteria(v_achievement.criteria, v_user_stats) THEN
            -- Unlock achievement
            INSERT INTO public.user_achievements (user_id, achievement_id)
            VALUES (p_user_id, v_achievement.id)
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
            
            -- Add to newly unlocked list
            v_newly_unlocked := array_append(v_newly_unlocked, v_achievement.id);
            
            -- Update user points
            UPDATE public.user_progress
            SET 
                total_points = total_points + v_achievement.points,
                total_xp = total_xp + v_achievement.xp_reward
            WHERE user_id = p_user_id;
            
            -- Return this achievement
            achievement_id := v_achievement.id;
            achievement_name := v_achievement.name;
            points := v_achievement.points;
            RETURN NEXT;
        END IF;
    END LOOP;
    
    -- Update user level if needed
    UPDATE public.user_progress
    SET 
        level = calculate_user_level(total_xp),
        level_progress = ((total_xp - xp_for_level(level)) * 100.0 / 
                         (xp_for_level(level + 1) - xp_for_level(level)))
    WHERE user_id = p_user_id;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check achievement criteria
CREATE OR REPLACE FUNCTION public.check_achievement_criteria(
    p_criteria JSONB,
    p_stats RECORD
) RETURNS BOOLEAN AS $$
DECLARE
    v_type TEXT;
    v_value NUMERIC;
    v_current NUMERIC;
BEGIN
    v_type := p_criteria->>'type';
    v_value := (p_criteria->>'value')::NUMERIC;
    
    CASE v_type
        WHEN 'transaction_count' THEN
            v_current := p_stats.transaction_count;
        WHEN 'unique_holdings' THEN
            v_current := p_stats.unique_holdings;
        WHEN 'total_invested' THEN
            v_current := p_stats.total_invested;
        WHEN 'investment_streak' THEN
            v_current := p_stats.investment_streak;
        WHEN 'esg_score' THEN
            v_current := p_stats.avg_esg_score;
        ELSE
            RETURN FALSE;
    END CASE;
    
    RETURN v_current >= v_value;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GAMIFICATION FUNCTIONS
-- =====================================================

-- Function to add points to user
CREATE OR REPLACE FUNCTION public.add_user_points(
    p_user_id UUID,
    p_points INTEGER,
    p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE public.user_progress
    SET 
        total_points = total_points + p_points,
        total_xp = total_xp + p_points,
        level = calculate_user_level(total_xp + p_points),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Check for new achievements after points update
    PERFORM check_achievements(p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Function to update investment streak
CREATE OR REPLACE FUNCTION public.update_investment_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_last_investment_date DATE;
    v_current_streak INTEGER;
    v_days_diff INTEGER;
BEGIN
    -- Get current streak and last investment date
    SELECT last_investment_date, investment_streak 
    INTO v_last_investment_date, v_current_streak
    FROM public.user_progress
    WHERE user_id = p_user_id;
    
    -- Calculate days difference
    v_days_diff := CURRENT_DATE - COALESCE(v_last_investment_date, CURRENT_DATE - 2);
    
    -- Update streak
    IF v_days_diff = 0 THEN
        -- Same day, no change
        RETURN v_current_streak;
    ELSIF v_days_diff = 1 THEN
        -- Next day, increment streak
        v_current_streak := COALESCE(v_current_streak, 0) + 1;
    ELSE
        -- Streak broken, reset to 1
        v_current_streak := 1;
    END IF;
    
    -- Update user progress
    UPDATE public.user_progress
    SET 
        investment_streak = v_current_streak,
        last_investment_date = CURRENT_DATE,
        longest_investment_streak = GREATEST(longest_investment_streak, v_current_streak)
    WHERE user_id = p_user_id;
    
    RETURN v_current_streak;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUTOMATION FUNCTIONS
-- =====================================================

-- Function to execute automation rules
CREATE OR REPLACE FUNCTION public.execute_automation_rules()
RETURNS TABLE(rule_id UUID, status TEXT, message TEXT) AS $$
DECLARE
    v_rule RECORD;
    v_execution_id UUID;
BEGIN
    -- Process scheduled automations
    FOR v_rule IN 
        SELECT * FROM public.automation_rules
        WHERE is_active = TRUE 
        AND is_paused = FALSE
        AND trigger_type = 'schedule'
        AND next_execution <= NOW()
    LOOP
        BEGIN
            -- Create execution record
            INSERT INTO public.automation_executions (
                automation_rule_id,
                execution_type,
                trigger_reason,
                status,
                planned_amount,
                started_at
            ) VALUES (
                v_rule.id,
                'scheduled',
                'Scheduled execution',
                'processing',
                v_rule.investment_amount,
                NOW()
            ) RETURNING id INTO v_execution_id;
            
            -- Execute the investment
            PERFORM execute_investment_allocation(v_rule.id, v_execution_id);
            
            -- Update execution status
            UPDATE public.automation_executions
            SET status = 'completed', completed_at = NOW()
            WHERE id = v_execution_id;
            
            -- Update rule next execution
            UPDATE public.automation_rules
            SET 
                next_execution = calculate_next_execution(v_rule.frequency),
                last_execution = NOW(),
                execution_count = execution_count + 1,
                successful_executions = successful_executions + 1
            WHERE id = v_rule.id;
            
            rule_id := v_rule.id;
            status := 'success';
            message := 'Automation executed successfully';
            RETURN NEXT;
            
        EXCEPTION WHEN OTHERS THEN
            -- Update execution status
            UPDATE public.automation_executions
            SET 
                status = 'failed',
                error_message = SQLERRM,
                completed_at = NOW()
            WHERE id = v_execution_id;
            
            -- Update rule failed count
            UPDATE public.automation_rules
            SET failed_executions = failed_executions + 1
            WHERE id = v_rule.id;
            
            rule_id := v_rule.id;
            status := 'failed';
            message := SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Helper function to calculate next execution
CREATE OR REPLACE FUNCTION public.calculate_next_execution(
    p_frequency investment_frequency
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    CASE p_frequency
        WHEN 'daily' THEN
            RETURN NOW() + INTERVAL '1 day';
        WHEN 'weekly' THEN
            RETURN NOW() + INTERVAL '1 week';
        WHEN 'biweekly' THEN
            RETURN NOW() + INTERVAL '2 weeks';
        WHEN 'monthly' THEN
            RETURN NOW() + INTERVAL '1 month';
        WHEN 'quarterly' THEN
            RETURN NOW() + INTERVAL '3 months';
        WHEN 'annually' THEN
            RETURN NOW() + INTERVAL '1 year';
        ELSE
            RETURN NOW() + INTERVAL '1 day';
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- AUDIT FUNCTIONS
-- =====================================================

-- Function to create audit log
CREATE OR REPLACE FUNCTION public.create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_values JSONB;
    v_new_values JSONB;
    v_user_id UUID;
BEGIN
    -- Get user ID from context or record
    IF TG_OP = 'DELETE' THEN
        v_old_values := to_jsonb(OLD);
        v_user_id := COALESCE(auth.uid(), (v_old_values->>'user_id')::UUID);
    ELSE
        v_new_values := to_jsonb(NEW);
        v_user_id := COALESCE(auth.uid(), (v_new_values->>'user_id')::UUID);
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        v_old_values := to_jsonb(OLD);
    END IF;
    
    -- Create audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        v_user_id,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_old_values,
        v_new_values
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holdings_updated_at BEFORE UPDATE ON public.holdings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_investments_updated_at BEFORE UPDATE ON public.recurring_investments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_esg_metrics_updated_at BEFORE UPDATE ON public.esg_metrics
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User creation trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Transaction validation trigger
CREATE TRIGGER validate_transaction_before_insert
    BEFORE INSERT ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.validate_transaction();

-- Audit triggers for sensitive operations
CREATE TRIGGER audit_bank_accounts_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.bank_accounts
    FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

CREATE TRIGGER audit_transactions_changes
    AFTER INSERT OR UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

CREATE TRIGGER audit_kyc_documents_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.kyc_documents
    FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

-- =====================================================
-- SCHEDULED JOBS (using pg_cron if available)
-- =====================================================

-- Note: These require pg_cron extension
-- Schedule daily portfolio snapshots
-- SELECT cron.schedule('daily-portfolio-snapshots', '0 0 * * *', 'SELECT record_portfolio_performance();');

-- Schedule automation rule execution every hour
-- SELECT cron.schedule('hourly-automation-execution', '0 * * * *', 'SELECT execute_automation_rules();');

-- Schedule achievement checks every 15 minutes
-- SELECT cron.schedule('check-achievements', '*/15 * * * *', 
--   'SELECT check_achievements(user_id) FROM public.user_progress WHERE updated_at > NOW() - INTERVAL ''15 minutes'';');

-- =====================================================
-- HELPER FUNCTIONS FOR DEVELOPMENT
-- =====================================================

-- Function to reset user achievements (for testing)
CREATE OR REPLACE FUNCTION public.reset_user_achievements(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Only allow in development
    IF current_setting('app.environment', TRUE) != 'development' THEN
        RAISE EXCEPTION 'This function is only available in development';
    END IF;
    
    DELETE FROM public.user_achievements WHERE user_id = p_user_id;
    UPDATE public.user_progress 
    SET total_points = 0, total_xp = 0, level = 1 
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.calculate_portfolio_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_points TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_investment_streak TO authenticated;