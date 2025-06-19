'use client'

import { Suspense } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

// Common authentication error messages
const errorMessages = {
  Configuration: {
    title: 'Configuration Error',
    description: 'There is a problem with the server configuration. Please contact support.',
    suggestion: 'Try again later or contact administrator'
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in with this account.',
    suggestion: 'Please check your account status or contact support'
  },
  Verification: {
    title: 'Verification Required',
    description: 'Please check your email and click the verification link to continue.',
    suggestion: 'Check your spam folder if you don\'t see the email'
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    description: 'This email is already associated with another sign-in method.',
    suggestion: 'Try signing in with your original method'
  },
  OAuthCallback: {
    title: 'OAuth Error',
    description: 'An error occurred during the OAuth sign-in process.',
    suggestion: 'Please try signing in again'
  },
  EmailCreateAccount: {
    title: 'Email Error',
    description: 'Could not create an account with this email address.',
    suggestion: 'Please try a different email or contact support'
  },
  Signin: {
    title: 'Sign In Error',
    description: 'An error occurred while trying to sign you in.',
    suggestion: 'Please try again or use a different sign-in method'
  },
  OAuthSignin: {
    title: 'OAuth Sign In Error',
    description: 'An error occurred with the OAuth provider.',
    suggestion: 'Please try again or use email sign-in'
  },
  CredentialsSignin: {
    title: 'Invalid Credentials',
    description: 'The credentials you provided are incorrect.',
    suggestion: 'Please check your email and password'
  },
  SessionRequired: {
    title: 'Authentication Required',
    description: 'You must be signed in to access this page.',
    suggestion: 'Please sign in to continue'
  },
  Default: {
    title: 'Authentication Error',
    description: 'An unexpected error occurred during authentication.',
    suggestion: 'Please try again or contact support if the problem persists'
  }
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Default'
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  
  const errorInfo = errorMessages[error as keyof typeof errorMessages] || errorMessages.Default
  
  const handleRetry = () => {
    window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-center">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  What can you do?
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {errorInfo.suggestion}
                </p>
              </div>
            </div>
          </div>

          {/* Additional error details for development */}
          {process.env.NODE_ENV === 'development' && error !== 'Default' && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Debug Information
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                Error Code: {error}
              </p>
              {callbackUrl && (
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  Callback URL: {callbackUrl}
                </p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <div className="flex space-x-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleRetry}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
          
          <div className="text-center">
            <Link 
              href="/auth/signin" 
              className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
            >
              Return to Sign In
            </Link>
          </div>

          <div className="text-sm text-center text-muted-foreground">
            Need help?{' '}
            <Link href="/contact" className="underline underline-offset-4 hover:text-primary">
              Contact Support
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4 text-center">
              <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}