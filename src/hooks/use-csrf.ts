import { useState, useEffect, useCallback } from 'react'
import { CSRF_CONFIG } from '@/lib/security/csrf'

interface CSRFTokenData {
  csrfToken: string
  expiresAt: string
}

interface UseCSRFReturn {
  csrfToken: string | null
  isLoading: boolean
  error: Error | null
  refreshToken: () => Promise<void>
  getHeaders: () => HeadersInit
}

/**
 * Hook to manage CSRF tokens in React components
 */
export function useCSRF(): UseCSRFReturn {
  const [csrfToken, setCSRFToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)

  // Fetch CSRF token
  const fetchCSRFToken = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token')
      }
      
      const data: CSRFTokenData = await response.json()
      setCSRFToken(data.csrfToken)
      setExpiresAt(new Date(data.expiresAt))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      console.error('Failed to fetch CSRF token:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh token
  const refreshToken = useCallback(async () => {
    await fetchCSRFToken()
  }, [fetchCSRFToken])

  // Get headers with CSRF token
  const getHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (csrfToken) {
      headers[CSRF_CONFIG.headerName] = csrfToken
    }
    
    return headers
  }, [csrfToken])

  // Initial fetch
  useEffect(() => {
    fetchCSRFToken()
  }, [fetchCSRFToken])

  // Auto-refresh before expiry
  useEffect(() => {
    if (!expiresAt || !csrfToken) return

    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    
    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000)
    
    const timeout = setTimeout(() => {
      fetchCSRFToken()
    }, refreshTime)
    
    return () => clearTimeout(timeout)
  }, [expiresAt, csrfToken, fetchCSRFToken])

  return {
    csrfToken,
    isLoading,
    error,
    refreshToken,
    getHeaders,
  }
}

/**
 * Helper function to add CSRF token to fetch requests
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get CSRF token from cookie if available
  const getCookieValue = (name: string): string | null => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }
  
  const csrfToken = getCookieValue(CSRF_CONFIG.cookieName)
  
  // Add CSRF token to headers if it's a state-changing request
  if (
    csrfToken &&
    options.method &&
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())
  ) {
    options.headers = {
      ...options.headers,
      [CSRF_CONFIG.headerName]: csrfToken,
    }
  }
  
  return fetch(url, {
    ...options,
    credentials: 'include', // Ensure cookies are sent
  })
}