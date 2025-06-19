'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/20 p-3">
              <div className="text-6xl font-bold text-yellow-600 dark:text-yellow-400">404</div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-center">
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              What you can try:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Check the URL for typos</li>
              <li>Return to the homepage</li>
              <li>Try searching for what you need</li>
              <li>Contact support if you believe this is an error</li>
            </ul>
          </div>

          {/* Show the attempted URL in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Debug Information
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <div className="flex space-x-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button
              className="flex-1"
              onClick={() => router.push('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Home
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