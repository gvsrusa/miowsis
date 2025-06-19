'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Metrics {
  users?: {
    total: number
    active: number
    new: number
    verified: number
  }
  transactions?: {
    total: number
    volume: number
    fees: number
    byType: Record<string, number>
  }
  portfolios?: {
    count: number
    totalValue: number
    totalInvested: number
    totalReturns: number
    averageValue: number
  }
  revenue?: {
    total: number
    daily: Record<string, number>
    average: number
  }
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<Metrics>({})
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    fetchMetrics()
  }, [period])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/metrics?period=${period}&metric=all`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }

      const data = await response.json()
      setMetrics(data.metrics)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {session?.user?.email}</p>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <label className="mr-2 text-sm font-medium text-gray-700">Period:</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading metrics...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2 xl:grid-cols-3">
          {/* User Metrics */}
          {metrics.users && (
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Users</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Users:</span>
                  <span className="font-medium">{formatNumber(metrics.users.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Users:</span>
                  <span className="font-medium">{formatNumber(metrics.users.active)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">New Users:</span>
                  <span className="font-medium text-green-600">+{formatNumber(metrics.users.new)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verified:</span>
                  <span className="font-medium">{formatNumber(metrics.users.verified)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Metrics */}
          {metrics.transactions && (
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Transactions</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Count:</span>
                  <span className="font-medium">{formatNumber(metrics.transactions.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume:</span>
                  <span className="font-medium">{formatCurrency(metrics.transactions.volume)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fees Collected:</span>
                  <span className="font-medium text-green-600">{formatCurrency(metrics.transactions.fees)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Metrics */}
          {metrics.portfolios && (
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Portfolios</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Count:</span>
                  <span className="font-medium">{formatNumber(metrics.portfolios.count)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-medium">{formatCurrency(metrics.portfolios.totalValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Value:</span>
                  <span className="font-medium">{formatCurrency(metrics.portfolios.averageValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Returns:</span>
                  <span className={`font-medium ${metrics.portfolios.totalReturns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(metrics.portfolios.totalReturns)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Metrics (Admin Only) */}
          {metrics.revenue && (
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Revenue</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-medium text-green-600">{formatCurrency(metrics.revenue.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Average:</span>
                  <span className="font-medium">{formatCurrency(metrics.revenue.average)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}