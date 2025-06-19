-- Example Queries for MIOwSIS Database
-- These queries demonstrate common operations and best practices

-- =====================================================
-- USER QUERIES
-- =====================================================

-- Get user profile with KYC status
SELECT 
    p.*,
    COUNT(DISTINCT po.id) as portfolio_count,
    up.level,
    up.total_points
FROM profiles p
LEFT JOIN portfolios po ON p.id = po.user_id AND po.is_active = TRUE
LEFT JOIN user_progress up ON p.id = up.user_id
WHERE p.id = 'user-uuid-here'
GROUP BY p.id, up.level, up.total_points;

-- Get users pending KYC verification
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.kyc_status,
    p.kyc_submitted_at,
    COUNT(kd.id) as document_count
FROM profiles p
LEFT JOIN kyc_documents kd ON p.id = kd.user_id
WHERE p.kyc_status IN ('pending', 'documents_uploaded', 'in_review')
GROUP BY p.id
ORDER BY p.kyc_submitted_at ASC;

-- =====================================================
-- PORTFOLIO QUERIES
-- =====================================================

-- Get portfolio summary with holdings
SELECT 
    p.*,
    COUNT(DISTINCT h.asset_id) as holdings_count,
    STRING_AGG(a.symbol, ', ' ORDER BY h.current_value DESC) as top_holdings
FROM portfolios p
LEFT JOIN holdings h ON p.id = h.portfolio_id
LEFT JOIN assets a ON h.asset_id = a.id
WHERE p.user_id = 'user-uuid-here'
    AND p.is_active = TRUE
GROUP BY p.id;

-- Get portfolio performance over time
SELECT 
    date,
    total_value,
    total_returns,
    total_returns_percentage,
    daily_change,
    daily_change_percentage
FROM portfolio_performance_history
WHERE portfolio_id = 'portfolio-uuid-here'
    AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;

-- Get top performing holdings
SELECT 
    a.symbol,
    a.name,
    h.quantity,
    h.average_cost,
    h.current_value,
    h.unrealized_pnl,
    h.unrealized_pnl_percentage,
    h.portfolio_percentage,
    em.total_score as esg_score
FROM holdings h
JOIN assets a ON h.asset_id = a.id
LEFT JOIN esg_metrics em ON a.id = em.asset_id
WHERE h.portfolio_id = 'portfolio-uuid-here'
ORDER BY h.unrealized_pnl_percentage DESC
LIMIT 10;

-- =====================================================
-- TRANSACTION QUERIES
-- =====================================================

-- Get recent transactions with asset details
SELECT 
    t.*,
    a.symbol,
    a.name,
    p.name as portfolio_name
FROM transactions t
LEFT JOIN assets a ON t.asset_id = a.id
LEFT JOIN portfolios p ON t.portfolio_id = p.id
WHERE t.user_id = 'user-uuid-here'
    AND t.created_at >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY t.created_at DESC
LIMIT 50;

-- Get transaction summary by type
SELECT 
    transaction_type,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    SUM(fee) as total_fees
FROM transactions
WHERE user_id = 'user-uuid-here'
    AND status = 'completed'
    AND created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY transaction_type
ORDER BY total_amount DESC;

-- Get pending orders
SELECT 
    io.*,
    a.symbol,
    a.name,
    a.current_price
FROM investment_orders io
JOIN assets a ON io.asset_id = a.id
WHERE io.user_id = 'user-uuid-here'
    AND io.status IN ('pending', 'processing')
ORDER BY io.placed_at DESC;

-- =====================================================
-- AUTOMATION QUERIES
-- =====================================================

-- Get active automation rules with next execution
SELECT 
    ar.*,
    p.name as portfolio_name,
    ae.completed_at as last_successful_execution
FROM automation_rules ar
JOIN portfolios p ON ar.portfolio_id = p.id
LEFT JOIN LATERAL (
    SELECT completed_at
    FROM automation_executions
    WHERE automation_rule_id = ar.id
        AND status = 'completed'
    ORDER BY completed_at DESC
    LIMIT 1
) ae ON TRUE
WHERE ar.user_id = 'user-uuid-here'
    AND ar.is_active = TRUE
    AND ar.is_paused = FALSE
ORDER BY ar.next_execution ASC;

-- Get round-up accumulation summary
SELECT 
    ar.name as rule_name,
    COUNT(ra.id) as transaction_count,
    SUM(ra.round_up_amount) as total_round_ups,
    SUM(ra.multiplied_amount) as total_to_invest,
    SUM(CASE WHEN ra.is_invested THEN ra.multiplied_amount ELSE 0 END) as total_invested
FROM round_up_accumulator ra
JOIN automation_rules ar ON ra.automation_rule_id = ar.id
WHERE ra.user_id = 'user-uuid-here'
    AND ra.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ar.id, ar.name;

-- =====================================================
-- ESG QUERIES
-- =====================================================

-- Get portfolio ESG breakdown
SELECT 
    p.name as portfolio_name,
    p.esg_score as portfolio_esg_score,
    AVG(em.environmental_score) as avg_environmental,
    AVG(em.social_score) as avg_social,
    AVG(em.governance_score) as avg_governance,
    SUM(h.quantity * em.carbon_footprint) as total_carbon_footprint
FROM portfolios p
JOIN holdings h ON p.id = h.portfolio_id
JOIN esg_metrics em ON h.asset_id = em.asset_id
WHERE p.user_id = 'user-uuid-here'
    AND p.is_active = TRUE
GROUP BY p.id, p.name, p.esg_score;

-- Get ESG leaders in portfolio
SELECT 
    a.symbol,
    a.name,
    em.total_score,
    em.environmental_score,
    em.social_score,
    em.governance_score,
    h.current_value,
    h.portfolio_percentage
FROM holdings h
JOIN assets a ON h.asset_id = a.id
JOIN esg_metrics em ON a.id = em.asset_id
WHERE h.portfolio_id = 'portfolio-uuid-here'
    AND em.total_score >= 80
ORDER BY em.total_score DESC, h.current_value DESC;

-- Get impact metrics over time
SELECT 
    date,
    metric_type,
    SUM(value) as total_value,
    unit,
    AVG(confidence_level) as avg_confidence
FROM impact_metrics
WHERE user_id = 'user-uuid-here'
    AND date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY date, metric_type, unit
ORDER BY date DESC, metric_type;

-- =====================================================
-- GAMIFICATION QUERIES
-- =====================================================

-- Get user achievements progress
SELECT 
    a.*,
    ua.unlocked_at,
    ua.progress,
    CASE 
        WHEN ua.id IS NOT NULL THEN 'unlocked'
        WHEN a.is_hidden THEN 'hidden'
        ELSE 'locked'
    END as status
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id 
    AND ua.user_id = 'user-uuid-here'
WHERE a.is_active = TRUE
    AND (a.is_hidden = FALSE OR ua.id IS NOT NULL)
ORDER BY 
    CASE WHEN ua.id IS NOT NULL THEN 0 ELSE 1 END,
    a.category,
    a.points DESC;

-- Get leaderboard with user context
WITH user_rank AS (
    SELECT 
        user_id,
        total_points,
        level,
        RANK() OVER (ORDER BY total_points DESC) as rank
    FROM user_progress
)
SELECT 
    ur.rank,
    p.username,
    p.avatar_url,
    ur.total_points,
    ur.level,
    CASE WHEN ur.user_id = 'user-uuid-here' THEN TRUE ELSE FALSE END as is_current_user
FROM user_rank ur
JOIN profiles p ON ur.user_id = p.id
WHERE ur.rank <= 100
    OR ur.user_id = 'user-uuid-here'
ORDER BY ur.rank;

-- Get active challenges for user
SELECT 
    c.*,
    uc.status,
    uc.progress,
    uc.started_at,
    CASE 
        WHEN uc.status = 'completed' THEN uc.completed_at - uc.started_at
        ELSE NULL
    END as completion_time
FROM challenges c
LEFT JOIN user_challenges uc ON c.id = uc.challenge_id 
    AND uc.user_id = 'user-uuid-here'
WHERE c.is_active = TRUE
    AND c.start_date <= NOW()
    AND c.end_date >= NOW()
ORDER BY 
    CASE WHEN uc.status = 'active' THEN 0 ELSE 1 END,
    c.end_date ASC;

-- =====================================================
-- ANALYTICS QUERIES (Using Materialized Views)
-- =====================================================

-- Get user portfolio summary from materialized view
SELECT * FROM mv_user_portfolio_summary
WHERE user_id = 'user-uuid-here';

-- Get top performing assets from materialized view
SELECT * FROM mv_asset_performance
WHERE held_by_portfolios > 10
ORDER BY avg_unrealized_pnl_percentage DESC
LIMIT 20;

-- Get platform-wide transaction trends
SELECT 
    transaction_date,
    transaction_count,
    unique_users,
    total_buy_amount + total_sell_amount as total_trading_volume,
    total_deposit_amount - total_withdrawal_amount as net_deposits
FROM mv_daily_transaction_summary
WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY transaction_date DESC;

-- =====================================================
-- USEFUL FUNCTION CALLS
-- =====================================================

-- Get complete dashboard data for a user
SELECT * FROM get_user_dashboard_data('user-uuid-here');

-- Get detailed portfolio holdings
SELECT * FROM get_portfolio_holdings('portfolio-uuid-here');

-- Calculate portfolio metrics (updates values)
SELECT calculate_portfolio_metrics('portfolio-uuid-here');

-- Check for new achievements
SELECT * FROM check_achievements('user-uuid-here');

-- Update investment streak
SELECT update_investment_streak('user-uuid-here');

-- =====================================================
-- ADMIN QUERIES
-- =====================================================

-- Platform statistics
SELECT 
    (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_30d,
    (SELECT COUNT(*) FROM profiles WHERE kyc_status = 'verified') as verified_users,
    (SELECT SUM(total_value) FROM portfolios WHERE is_active = TRUE) as total_aum,
    (SELECT COUNT(*) FROM transactions WHERE created_at >= CURRENT_DATE - INTERVAL '24 hours') as transactions_24h,
    (SELECT SUM(amount) FROM transactions 
     WHERE transaction_type IN ('buy', 'sell') 
     AND status = 'completed'
     AND created_at >= CURRENT_DATE - INTERVAL '24 hours') as volume_24h;

-- Database health check
SELECT * FROM analyze_database_health();

-- Slow query analysis (requires pg_stat_statements)
SELECT * FROM get_slow_queries(INTERVAL '500 milliseconds');