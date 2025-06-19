'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { signOut, useSession } from 'next-auth/react'

import { LogOut, CheckCircle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignOutPage() {
  const { data: session, status } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signedOut, setSignedOut] = useState(false)

  // Auto sign out if user is authenticated and hasn't been signed out yet
  useEffect(() => {
    if (status === 'authenticated' && !isSigningOut && !signedOut) {
      handleSignOut()
    }
  }, [status, isSigningOut, signedOut])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/' 
      })
      setSignedOut(true)
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleReturnHome = () => {
    window.location.href = '/'
  }

  const handleSignInAgain = () => {
    window.location.href = '/auth/signin'
  }

  // Show loading state while determining session status
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show signing out state
  if (isSigningOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3">
                <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Signing Out</CardTitle>
            <CardDescription className="text-center">
              Please wait while we sign you out safely...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Show signed out confirmation
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Signed Out Successfully</CardTitle>
          <CardDescription className="text-center">
            You have been safely signed out of your MIOwSIS account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Your session has ended
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your data is secure and all active sessions have been terminated
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              What you can do next:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Browse our public features on the homepage</li>
              <li>Sign in again to access your account</li>
              <li>Learn more about sustainable investing</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <div className="flex space-x-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleReturnHome}
            >
              Return Home
            </Button>
            <Button
              className="flex-1"
              onClick={handleSignInAgain}
            >
              <LogOut className="mr-2 h-4 w-4 rotate-180" />
              Sign In Again
            </Button>
          </div>

          <div className="text-sm text-center text-muted-foreground">
            Thank you for using{' '}
            <Link href="/" className="underline underline-offset-4 hover:text-primary">
              MIOwSIS
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}