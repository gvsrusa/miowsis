'use client'

import { type ReactNode } from 'react'

import { redirect } from 'next/navigation'

import { useSession } from 'next-auth/react'

import { MainNav } from '@/components/layout/main-nav'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { status } = useSession()

  if (status === 'unauthenticated') {
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