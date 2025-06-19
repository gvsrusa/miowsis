'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'

import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function VerifyRequestPage() {
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    // Try to get email from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email')
    
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Fallback to localStorage if available (from sign-in form)
      const savedEmail = localStorage.getItem('pendingSignInEmail')
      if (savedEmail) {
        setEmail(savedEmail)
        localStorage.removeItem('pendingSignInEmail') // Clean up
      }
    }
  }, [])

  const handleResendEmail = () => {
    if (email) {
      // Redirect back to sign-in with the email pre-filled
      window.location.href = `/auth/signin?email=${encodeURIComponent(email)}`
    } else {
      window.location.href = '/auth/signin'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription className="text-center">
            We've sent a magic link to your email address
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {email && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Email sent to:
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-mono">
                    {email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-1">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Click the link in your email</h4>
                <p className="text-sm text-muted-foreground">
                  The magic link will sign you in automatically
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/20 p-1">
                <Mail className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Check your spam folder</h4>
                <p className="text-sm text-muted-foreground">
                  Sometimes emails end up in spam or promotions
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-1">
                <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Link expires in 24 hours</h4>
                <p className="text-sm text-muted-foreground">
                  You can request a new link if needed
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What happens next?
            </h4>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>Open your email app</li>
              <li>Find the email from MIOwSIS</li>
              <li>Click the "Sign In" button or link</li>
              <li>You'll be automatically signed in</li>
            </ol>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <div className="flex space-x-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = '/auth/signin'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
            <Button
              className="flex-1"
              onClick={handleResendEmail}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend Email
            </Button>
          </div>

          <div className="text-sm text-center text-muted-foreground">
            Having trouble?{' '}
            <Link href="/contact" className="underline underline-offset-4 hover:text-primary">
              Contact Support
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}