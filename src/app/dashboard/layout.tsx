'use client'

import { type ReactNode } from 'react'

import { redirect } from 'next/navigation'

import { useAuth } from '@/contexts/auth-context'

import { MainNav } from '@/components/layout/main-nav'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth()

  if (!loading && !user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}