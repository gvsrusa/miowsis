'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        
        console.log('[Auth Callback] Starting with code:', code?.substring(0, 10) + '...')
        console.log('[Auth Callback] URL:', window.location.href)
        
        if (error) {
          console.error('[Auth Callback] OAuth error:', error)
          setError(error)
          setStatus('error')
          return
        }

        if (!code) {
          console.error('[Auth Callback] No authorization code received')
          setError('No authorization code received')
          setStatus('error')
          return
        }

        // Check if already authenticated
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        console.log('[Auth Callback] Current session:', currentSession?.user?.email)
        
        if (currentSession) {
          console.log('[Auth Callback] Already authenticated, redirecting...')
          setStatus('success')
          const callbackUrl = searchParams.get('state') || '/dashboard'
          router.push(callbackUrl)
          return
        }

        // Exchange code for session
        console.log('[Auth Callback] Exchanging code for session...')
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.error('[Auth Callback] Exchange error:', exchangeError)
          setError(exchangeError.message)
          setStatus('error')
          return
        }

        console.log('[Auth Callback] Exchange successful:', data?.session?.user?.email)
        
        if (data?.session) {
          setStatus('success')
          // Redirect immediately
          const callbackUrl = searchParams.get('state') || '/dashboard'
          console.log('[Auth Callback] Redirecting to:', callbackUrl)
          router.push(callbackUrl)
        } else {
          console.error('[Auth Callback] No session in response')
          setError('No session created')
          setStatus('error')
        }
      } catch (err) {
        console.error('[Auth Callback] Unexpected error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setStatus('error')
      }
    }

    handleAuthCallback()
  }, [searchParams, router, supabase.auth])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3">
                <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Completing sign in...</CardTitle>
            <CardDescription>
              Please wait while we process your authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-pulse space-y-2">
                <div className="h-2 bg-gray-200 rounded w-64" />
                <div className="h-2 bg-gray-200 rounded w-48" />
                <div className="h-2 bg-gray-200 rounded w-56" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
            <CardDescription>
              You've successfully signed in. Redirecting you to your dashboard...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Authentication failed</CardTitle>
          <CardDescription>
            There was a problem completing your sign in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              {error || 'An unknown error occurred'}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/auth/signin')}
            >
              Try Again
            </Button>
            <Button
              className="flex-1"
              onClick={() => router.push('/')}
            >
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}