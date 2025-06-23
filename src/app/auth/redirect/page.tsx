'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    const checkAndRedirect = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard')
      } else {
        // Not authenticated, go to sign in
        router.push('/auth/signin')
      }
    }
    
    checkAndRedirect()
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl">Redirecting...</h1>
      </div>
    </div>
  )
}