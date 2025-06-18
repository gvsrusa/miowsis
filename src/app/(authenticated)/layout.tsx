'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { MainNav } from '@/components/layout/main-nav'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
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