import { NextRequest, NextResponse } from 'next/server'
import { withRoleAuth } from '@/lib/rbac'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// GET /api/admin/metrics - Get platform metrics (admin and moderator)
export async function GET(request: NextRequest) {
  return withRoleAuth(request, ['admin', 'moderator'], async (req, userId, userRole) => {
    try {
      const searchParams = req.nextUrl.searchParams
      const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, 1y
      const metric = searchParams.get('metric') || 'all' // all, users, transactions, portfolios, revenue

      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get: () => null,
            set: () => {},
            remove: () => {},
          },
        }
      )

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      switch (period) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(startDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      const metrics: any = {}

      // User metrics
      if (metric === 'all' || metric === 'users') {
        const { data: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        const { data: activeUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        const { data: newUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString())

        const { data: verifiedUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_verified', true)

        metrics.users = {
          total: totalUsers?.count || 0,
          active: activeUsers?.count || 0,
          new: newUsers?.count || 0,
          verified: verifiedUsers?.count || 0,
        }
      }

      // Transaction metrics
      if (metric === 'all' || metric === 'transactions') {
        const { data: transactionStats } = await supabase
          .from('transactions')
          .select('transaction_type, amount, fee', { count: 'exact' })
          .gte('created_at', startDate.toISOString())
          .eq('status', 'completed')

        const transactionSummary = {
          total: transactionStats?.length || 0,
          volume: 0,
          fees: 0,
          byType: {} as Record<string, number>,
        }

        if (transactionStats) {
          transactionStats.forEach(tx => {
            transactionSummary.volume += tx.amount
            transactionSummary.fees += tx.fee
            transactionSummary.byType[tx.transaction_type] = 
              (transactionSummary.byType[tx.transaction_type] || 0) + 1
          })
        }

        metrics.transactions = transactionSummary
      }

      // Portfolio metrics
      if (metric === 'all' || metric === 'portfolios') {
        const { data: portfolioStats } = await supabase
          .from('portfolios')
          .select('total_value, total_invested, total_returns')
          .eq('is_active', true)

        const portfolioSummary = {
          count: portfolioStats?.length || 0,
          totalValue: 0,
          totalInvested: 0,
          totalReturns: 0,
          averageValue: 0,
        }

        if (portfolioStats) {
          portfolioStats.forEach(portfolio => {
            portfolioSummary.totalValue += portfolio.total_value
            portfolioSummary.totalInvested += portfolio.total_invested
            portfolioSummary.totalReturns += portfolio.total_returns
          })
          portfolioSummary.averageValue = portfolioSummary.count > 0 
            ? portfolioSummary.totalValue / portfolioSummary.count 
            : 0
        }

        metrics.portfolios = portfolioSummary
      }

      // Revenue metrics (admin only)
      if (userRole === 'admin' && (metric === 'all' || metric === 'revenue')) {
        const { data: revenueData } = await supabase
          .from('transactions')
          .select('fee, created_at')
          .gte('created_at', startDate.toISOString())
          .eq('status', 'completed')

        const dailyRevenue: Record<string, number> = {}
        let totalRevenue = 0

        if (revenueData) {
          revenueData.forEach(tx => {
            const date = new Date(tx.created_at).toISOString().split('T')[0]
            dailyRevenue[date] = (dailyRevenue[date] || 0) + tx.fee
            totalRevenue += tx.fee
          })
        }

        metrics.revenue = {
          total: totalRevenue,
          daily: dailyRevenue,
          average: Object.keys(dailyRevenue).length > 0 
            ? totalRevenue / Object.keys(dailyRevenue).length 
            : 0,
        }
      }

      return NextResponse.json({
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        metrics,
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch metrics', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  })
}