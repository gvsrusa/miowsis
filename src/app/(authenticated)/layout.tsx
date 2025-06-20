'use client'

import { type ReactNode } from 'react'

import { redirect } from 'next/navigation'

import { useAuth } from '@/contexts/auth-context'

import { MainNav } from '@/components/layout/main-nav'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
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