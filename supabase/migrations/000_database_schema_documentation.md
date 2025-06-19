# MIOwSIS Database Schema Documentation

## Overview

The MIOwSIS database is designed as a comprehensive financial platform supporting sustainable investing, portfolio management, ESG tracking, gamification, and automated investment strategies. The schema is built on PostgreSQL with Supabase, utilizing advanced features like Row Level Security (RLS), custom types, triggers, and materialized views.

## Migration Files

1. **001_init_extensions_and_types.sql** - Database initialization with extensions and custom types
2. **002_auth_and_profiles.sql** - User authentication, profiles, KYC, and audit logging
3. **003_portfolios_assets_holdings.sql** - Portfolio management, assets, and holdings
4. **004_transactions_and_orders.sql** - Financial transactions and investment orders
5. **005_automation_and_roundup.sql** - Automated investing and round-up features
6. **006_esg_and_impact.sql** - ESG metrics and impact tracking
7. **007_gamification_achievements.sql** - Gamification, achievements, and social features
8. **008_functions_and_triggers.sql** - Database functions, triggers, and stored procedures
9. **009_performance_indexes_optimizations.sql** - Performance optimizations and monitoring

## Core Tables

### User Management
- **profiles** - Extended user profiles with KYC status and preferences
- **kyc_documents** - KYC document storage and verification
- **bank_accounts** - Linked bank accounts with encryption
- **user_sessions** - Session tracking and security
- **audit_logs** - Compliance and audit trail

### Portfolio Management
- **portfolios** - User investment portfolios
- **assets** - Master table of investable assets
- **holdings** - Portfolio positions and allocations
- **asset_price_history** - Historical price data
- **portfolio_performance_history** - Daily portfolio snapshots
- **watchlist_items** - User watchlists

### Transactions
- **transactions** - All financial movements
- **investment_orders** - Buy/sell orders
- **order_fills** - Partial fill tracking
- **recurring_investments** - Scheduled investments
- **transaction_logs** - Detailed transaction history
- **payment_methods** - Saved payment methods

### Automation
- **automation_rules** - Smart investment rules
- **round_up_accumulator** - Round-up tracking
- **automation_executions** - Execution history
- **smart_suggestions** - AI-powered suggestions
- **market_conditions** - Market data for triggers

### ESG & Impact
- **esg_metrics** - Asset ESG scores
- **impact_tracking** - Portfolio impact metrics
- **impact_metrics** - User-level impact aggregation
- **esg_goals** - Sustainability targets
- **esg_recommendations** - ESG improvement suggestions
- **esg_certifications** - Available certifications
- **user_esg_certifications** - Earned certifications

### Gamification
- **achievements** - Achievement definitions
- **user_achievements** - Unlocked achievements
- **user_progress** - Points, levels, and streaks
- **leaderboards** - Competition rankings
- **leaderboard_entries** - User rankings
- **challenges** - Active challenges
- **user_challenges** - Challenge participation
- **badges** - Visual achievements
- **user_badges** - Earned badges
- **notifications** - User notifications

## Key Features

### Security
- Row Level Security (RLS) on all tables
- Encrypted sensitive data (bank accounts, tokens)
- Comprehensive audit logging
- Session tracking and risk scoring

### Performance
- Strategic indexes on all foreign keys and common queries
- Partial indexes for specific use cases
- Materialized views for reporting
- Table partitioning ready for scale
- Optimized autovacuum settings

### Data Integrity
- Foreign key constraints
- Check constraints for data validation
- Unique constraints to prevent duplicates
- Trigger-based data consistency

### Automation
- Scheduled job support (pg_cron)
- Event-driven triggers
- Automated calculations
- Smart notifications

## Custom Types

### User & Auth
- `user_role`: user, premium, admin, moderator
- `kyc_status`: pending, documents_uploaded, in_review, verified, rejected, expired

### Financial
- `transaction_type`: deposit, withdrawal, buy, sell, dividend, fee, transfer, round_up
- `transaction_status`: pending, processing, completed, failed, cancelled, reversed
- `investment_status`: pending, processing, executed, cancelled, failed, partially_filled
- `asset_type`: stock, etf, mutual_fund, bond, crypto, commodity, reit

### Automation
- `investment_frequency`: daily, weekly, biweekly, monthly, quarterly, annually
- `investment_trigger`: schedule, round_up, goal_based, market_dip, rebalance
- `allocation_strategy`: equal_weight, market_cap, esg_weighted, risk_weighted, custom

### Gamification
- `achievement_category`: investment, esg, streak, education, social, milestone
- `achievement_rarity`: common, rare, epic, legendary, mythic
- `notification_type`: info, success, warning, error, achievement, market_alert, transaction

## Key Functions

### Portfolio Management
- `calculate_portfolio_metrics()` - Update portfolio values and returns
- `record_portfolio_performance()` - Daily snapshots
- `get_portfolio_holdings()` - Efficient holdings query

### User Progress
- `check_achievements()` - Unlock new achievements
- `add_user_points()` - Award points
- `update_investment_streak()` - Track streaks
- `calculate_user_level()` - XP to level conversion

### Automation
- `execute_automation_rules()` - Run scheduled investments
- `calculate_next_execution()` - Schedule next run
- `validate_transaction()` - Pre-transaction validation

### Utilities
- `handle_new_user()` - New user setup
- `create_audit_log()` - Audit trail
- `update_updated_at_column()` - Timestamp updates

## Materialized Views

1. **mv_user_portfolio_summary** - Aggregated user portfolio data
2. **mv_asset_performance** - Asset metrics and holdings
3. **mv_daily_transaction_summary** - Daily transaction analytics

## Best Practices

### Query Optimization
- Use provided functions for complex queries
- Leverage materialized views for reporting
- Utilize partial indexes for filtered queries

### Data Integrity
- Always use transactions for multi-table updates
- Respect foreign key constraints
- Validate data before insertion

### Security
- Never bypass RLS policies
- Encrypt sensitive data
- Log all sensitive operations

### Maintenance
- Regular VACUUM ANALYZE
- Monitor table bloat
- Refresh materialized views daily
- Archive old data periodically

## Migration Instructions

1. Run migrations in order (001-009)
2. Each migration is idempotent and can be re-run safely
3. Test in development before production
4. Back up database before major migrations
5. Monitor performance after deployment

## Future Considerations

- Table partitioning for transactions and price history
- Additional indexes based on query patterns
- More materialized views for analytics
- Archive strategy for old data
- Read replicas for reporting