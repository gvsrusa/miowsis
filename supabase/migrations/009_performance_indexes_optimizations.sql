-- Migration: 009_performance_indexes_optimizations
-- Description: Additional performance indexes, materialized views, and query optimizations

-- =====================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- =====================================================

-- Composite indexes for common query patterns
CREATE INDEX idx_holdings_portfolio_value ON public.holdings(portfolio_id, current_value DESC);
CREATE INDEX idx_holdings_portfolio_percentage ON public.holdings(portfolio_id, portfolio_percentage DESC);

-- Transactions performance indexes
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_portfolio_date ON public.transactions(portfolio_id, created_at DESC);
CREATE INDEX idx_transactions_automation ON public.transactions(automation_rule_id) WHERE automation_rule_id IS NOT NULL;

-- Investment orders composite indexes
CREATE INDEX idx_orders_user_status_date ON public.investment_orders(user_id, status, placed_at DESC);
CREATE INDEX idx_orders_portfolio_status ON public.investment_orders(portfolio_id, status);

-- Automation rules optimization
CREATE INDEX idx_automation_execution_time ON public.automation_rules(next_execution, is_active, is_paused) 
    WHERE is_active = TRUE AND is_paused = FALSE;
CREATE INDEX idx_automation_user_active ON public.automation_rules(user_id, is_active) 
    WHERE is_active = TRUE;

-- Round-up accumulator optimization
CREATE INDEX idx_roundup_pending ON public.round_up_accumulator(automation_rule_id, created_at) 
    WHERE is_invested = FALSE AND is_cancelled = FALSE;

-- ESG metrics optimization
CREATE INDEX idx_esg_scores ON public.esg_metrics(total_score DESC, environmental_score DESC, social_score DESC, governance_score DESC);
CREATE INDEX idx_esg_controversy ON public.esg_metrics(controversy_score) WHERE controversy_score > 5;

-- Achievements optimization
CREATE INDEX idx_achievements_category_rarity ON public.achievements(category, rarity);
CREATE INDEX idx_user_achievements_recent ON public.user_achievements(user_id, unlocked_at DESC);

-- Notifications optimization
CREATE INDEX idx_notifications_user_priority ON public.notifications(user_id, priority, created_at DESC) 
    WHERE is_read = FALSE AND is_archived = FALSE;
CREATE INDEX idx_notifications_expiry ON public.notifications(expires_at) 
    WHERE expires_at IS NOT NULL AND is_read = FALSE;

-- =====================================================
-- PARTIAL INDEXES FOR SPECIFIC QUERIES
-- =====================================================

-- Active portfolios with high value
CREATE INDEX idx_portfolios_high_value ON public.portfolios(total_value DESC) 
    WHERE is_active = TRUE AND total_value > 10000;

-- Recent high-value transactions
CREATE INDEX idx_transactions_high_value ON public.transactions(amount DESC, created_at DESC) 
    WHERE status = 'completed' AND amount > 1000;

-- Users with verified KYC
CREATE INDEX idx_profiles_verified ON public.profiles(kyc_verified_at) 
    WHERE kyc_status = 'verified';

-- Active automation rules by trigger type
CREATE INDEX idx_automation_market_dip ON public.automation_rules(market_dip_threshold) 
    WHERE trigger_type = 'market_dip' AND is_active = TRUE;

-- =====================================================
-- MATERIALIZED VIEWS FOR REPORTING
-- =====================================================

-- User portfolio summary view
CREATE MATERIALIZED VIEW public.mv_user_portfolio_summary AS
SELECT 
    p.user_id,
    COUNT(DISTINCT p.id) as portfolio_count,
    SUM(p.total_value) as total_portfolio_value,
    SUM(p.total_invested) as total_amount_invested,
    SUM(p.total_returns) as total_returns,
    AVG(p.total_returns_percentage) as avg_return_percentage,
    MAX(p.total_value) as largest_portfolio_value,
    AVG(p.esg_score) as avg_esg_score,
    COUNT(DISTINCT h.asset_id) as unique_assets_count
FROM public.portfolios p
LEFT JOIN public.holdings h ON p.id = h.portfolio_id
WHERE p.is_active = TRUE
GROUP BY p.user_id;

CREATE UNIQUE INDEX idx_mv_user_portfolio_summary ON public.mv_user_portfolio_summary(user_id);

-- Asset performance view
CREATE MATERIALIZED VIEW public.mv_asset_performance AS
SELECT 
    a.id,
    a.symbol,
    a.name,
    a.asset_type,
    a.current_price,
    COUNT(DISTINCT h.portfolio_id) as held_by_portfolios,
    SUM(h.quantity) as total_quantity_held,
    SUM(h.current_value) as total_value_held,
    AVG(h.unrealized_pnl_percentage) as avg_unrealized_pnl_percentage,
    em.total_score as esg_score,
    em.environmental_score,
    em.social_score,
    em.governance_score
FROM public.assets a
LEFT JOIN public.holdings h ON a.id = h.asset_id
LEFT JOIN public.esg_metrics em ON a.id = em.asset_id
GROUP BY a.id, a.symbol, a.name, a.asset_type, a.current_price, 
         em.total_score, em.environmental_score, em.social_score, em.governance_score;

CREATE UNIQUE INDEX idx_mv_asset_performance ON public.mv_asset_performance(id);
CREATE INDEX idx_mv_asset_performance_symbol ON public.mv_asset_performance(symbol);

-- Daily transaction summary
CREATE MATERIALIZED VIEW public.mv_daily_transaction_summary AS
SELECT 
    DATE(created_at) as transaction_date,
    COUNT(*) as transaction_count,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(CASE WHEN transaction_type = 'buy' THEN amount ELSE 0 END) as total_buy_amount,
    SUM(CASE WHEN transaction_type = 'sell' THEN amount ELSE 0 END) as total_sell_amount,
    SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposit_amount,
    SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawal_amount,
    SUM(fee) as total_fees_collected,
    AVG(amount) as avg_transaction_amount
FROM public.transactions
WHERE status = 'completed'
GROUP BY DATE(created_at);

CREATE UNIQUE INDEX idx_mv_daily_transaction ON public.mv_daily_transaction_summary(transaction_date);

-- =====================================================
-- QUERY OPTIMIZATION FUNCTIONS
-- =====================================================

-- Function to get user dashboard data efficiently
CREATE OR REPLACE FUNCTION public.get_user_dashboard_data(p_user_id UUID)
RETURNS TABLE (
    total_portfolio_value DECIMAL(20, 2),
    total_invested DECIMAL(20, 2),
    total_returns DECIMAL(20, 2),
    total_returns_percentage DECIMAL(10, 4),
    portfolio_count INTEGER,
    achievement_count INTEGER,
    user_level INTEGER,
    investment_streak INTEGER,
    unread_notifications INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(p.total_value), 0),
        COALESCE(SUM(p.total_invested), 0),
        COALESCE(SUM(p.total_returns), 0),
        CASE 
            WHEN SUM(p.total_invested) > 0 
            THEN (SUM(p.total_returns) / SUM(p.total_invested)) * 100 
            ELSE 0 
        END,
        COUNT(DISTINCT p.id)::INTEGER,
        (SELECT COUNT(*)::INTEGER FROM public.user_achievements WHERE user_id = p_user_id),
        (SELECT level FROM public.user_progress WHERE user_id = p_user_id),
        (SELECT investment_streak FROM public.user_progress WHERE user_id = p_user_id),
        (SELECT COUNT(*)::INTEGER FROM public.notifications 
         WHERE user_id = p_user_id AND is_read = FALSE AND is_archived = FALSE)
    FROM public.portfolios p
    WHERE p.user_id = p_user_id AND p.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get portfolio holdings efficiently
CREATE OR REPLACE FUNCTION public.get_portfolio_holdings(p_portfolio_id UUID)
RETURNS TABLE (
    asset_id UUID,
    symbol TEXT,
    name TEXT,
    quantity DECIMAL(20, 8),
    current_price DECIMAL(20, 6),
    current_value DECIMAL(20, 2),
    average_cost DECIMAL(20, 6),
    unrealized_pnl DECIMAL(20, 2),
    unrealized_pnl_percentage DECIMAL(10, 4),
    portfolio_percentage DECIMAL(5, 2),
    esg_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.asset_id,
        a.symbol,
        a.name,
        h.quantity,
        a.current_price,
        h.current_value,
        h.average_cost,
        h.unrealized_pnl,
        h.unrealized_pnl_percentage,
        h.portfolio_percentage,
        em.total_score
    FROM public.holdings h
    JOIN public.assets a ON h.asset_id = a.id
    LEFT JOIN public.esg_metrics em ON a.id = em.asset_id
    WHERE h.portfolio_id = p_portfolio_id
    ORDER BY h.current_value DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- =====================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION public.refresh_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_portfolio_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_asset_performance;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_daily_transaction_summary;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABLE PARTITIONING FOR LARGE TABLES
-- =====================================================

-- Partition transactions table by year (for future scaling)
-- Note: This requires recreating the table, so it's commented out for now
-- But here's the structure for reference:

/*
-- Rename existing table
ALTER TABLE public.transactions RENAME TO transactions_old;

-- Create partitioned table
CREATE TABLE public.transactions (
    LIKE public.transactions_old INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE public.transactions_2024 PARTITION OF public.transactions
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE public.transactions_2025 PARTITION OF public.transactions
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Copy data
INSERT INTO public.transactions SELECT * FROM public.transactions_old;

-- Drop old table
DROP TABLE public.transactions_old;
*/

-- =====================================================
-- VACUUM AND ANALYZE SETTINGS
-- =====================================================

-- Set autovacuum settings for frequently updated tables
ALTER TABLE public.portfolios SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE public.holdings SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE public.transactions SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE public.asset_price_history SET (autovacuum_vacuum_scale_factor = 0.05);

-- =====================================================
-- MONITORING AND MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to analyze table sizes and bloat
CREATE OR REPLACE FUNCTION public.analyze_database_health()
RETURNS TABLE (
    table_name TEXT,
    total_size TEXT,
    table_size TEXT,
    indexes_size TEXT,
    estimated_bloat TEXT,
    estimated_bloat_percentage DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)),
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)),
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)),
        pg_size_pretty((pg_total_relation_size(schemaname||'.'||tablename) - 
                       pg_relation_size(schemaname||'.'||tablename) - 
                       pg_indexes_size(schemaname||'.'||tablename))),
        ROUND(100.0 * (pg_total_relation_size(schemaname||'.'||tablename) - 
                      pg_relation_size(schemaname||'.'||tablename) - 
                      pg_indexes_size(schemaname||'.'||tablename)) / 
                      NULLIF(pg_total_relation_size(schemaname||'.'||tablename), 0), 2)
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to get slow queries
CREATE OR REPLACE FUNCTION public.get_slow_queries(p_min_duration INTERVAL DEFAULT '1 second')
RETURNS TABLE (
    query TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    max_time DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        LEFT(query, 100),
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time
    FROM pg_stat_statements
    WHERE mean_exec_time > EXTRACT(MILLISECONDS FROM p_min_duration)
    ORDER BY mean_exec_time DESC
    LIMIT 20;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'pg_stat_statements extension not installed';
        RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE CONFIGURATION RECOMMENDATIONS
-- =====================================================

-- Recommended PostgreSQL configuration for optimal performance:
-- shared_buffers = 256MB (or 25% of available RAM)
-- effective_cache_size = 1GB (or 75% of available RAM)
-- work_mem = 4MB
-- maintenance_work_mem = 64MB
-- random_page_cost = 1.1 (for SSD storage)
-- effective_io_concurrency = 200 (for SSD storage)
-- max_parallel_workers_per_gather = 2
-- max_parallel_workers = 8

-- =====================================================
-- SCHEDULED MAINTENANCE (using pg_cron)
-- =====================================================

-- Schedule daily materialized view refresh
-- SELECT cron.schedule('refresh-materialized-views', '0 1 * * *', 'SELECT refresh_materialized_views();');

-- Schedule weekly vacuum analyze
-- SELECT cron.schedule('weekly-vacuum-analyze', '0 3 * * 0', 'VACUUM ANALYZE;');

-- Schedule monthly database health check
-- SELECT cron.schedule('monthly-health-check', '0 4 1 * *', 'SELECT * FROM analyze_database_health();');

-- =====================================================
-- GRANTS FOR PERFORMANCE FUNCTIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_user_dashboard_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_portfolio_holdings TO authenticated;
GRANT SELECT ON public.mv_user_portfolio_summary TO authenticated;
GRANT SELECT ON public.mv_asset_performance TO authenticated;
GRANT SELECT ON public.mv_daily_transaction_summary TO authenticated;