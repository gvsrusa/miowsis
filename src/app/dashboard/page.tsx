'use client'

import { useEffect, useState } from 'react'

import { redirect } from 'next/navigation'

import { useSession } from 'next-auth/react'

import { WidgetDashboard } from '@/components/dashboard/widget-dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  full_name: string
  onboarding_completed: boolean
}

interface Portfolio {
  id: string
  name: string
  total_value: number
  total_invested: number
  total_returns: number
  esg_score: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      if (!session?.user?.id) return

      const supabase = createClient()

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        
        if (!profileData.onboarding_completed) {
          redirect('/onboarding')
        }
      }

      // Fetch portfolio data
      const { data: portfolioData } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single()

      if (portfolioData) {
        setPortfolio(portfolioData)
      }

      setIsLoading(false)
    }

    if (status === 'authenticated') {
      loadDashboardData()
    }
  }, [session, status])

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  if (status === 'loading' || isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <WidgetDashboard 
        data={{
          portfolio: portfolio || undefined,
          profile: profile || undefined,
        }}
      />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-64" data-testid="skeleton" />
        <Skeleton className="h-5 w-96 mt-2" data-testid="skeleton" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-48 md:col-span-2" data-testid="skeleton" />
        <Skeleton className="h-48" data-testid="skeleton" />
        <Skeleton className="h-48" data-testid="skeleton" />
        <Skeleton className="h-32 md:col-span-2 lg:col-span-4" data-testid="skeleton" />
      </div>
    </div>
  )
}