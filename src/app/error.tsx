'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Runtime error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
            Something went wrong!
          </CardTitle>
          <CardDescription className="text-center">
            An unexpected error occurred while processing your request.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              What happened?
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {error.message || 'An unexpected error occurred. Our team has been notified.'}
            </p>
          </div>

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Debug Information
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono mb-1">
                Error: {error.name}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono mb-1">
                  Digest: {error.digest}
                </p>
              )}
              <details className="mt-2">
                <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                  Stack Trace
                </summary>
                <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-2 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                  {error.stack}
                </pre>
              </details>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <div className="flex space-x-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            <Button
              className="flex-1"
              onClick={() => reset()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
          
          <div className="text-center">
            <Link 
              href="/dashboard" 
              className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
            >
              Go to Dashboard
            </Link>
          </div>

          <div className="text-sm text-center text-muted-foreground">
            If this problem persists,{' '}
            <Link href="/contact" className="underline underline-offset-4 hover:text-primary">
              contact support
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}