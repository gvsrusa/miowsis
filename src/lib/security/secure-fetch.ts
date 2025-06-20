import { CSRF_CONFIG } from './csrf'

/**
 * Enhanced fetch that automatically includes CSRF tokens for state-changing requests
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get CSRF token from cookie if available
  const getCookieValue = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }
  
  const method = (options.method || 'GET').toUpperCase()
  
  // Add CSRF token to headers if it's a state-changing request
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrfToken = getCookieValue(CSRF_CONFIG.cookieName)
    
    if (!csrfToken) {
      // Try to fetch a new CSRF token
      try {
        const tokenResponse = await fetch('/api/auth/csrf', {
          method: 'GET',
          credentials: 'include',
        })
        
        if (tokenResponse.ok) {
          const { csrfToken: newToken } = await tokenResponse.json()
          options.headers = {
            ...options.headers,
            [CSRF_CONFIG.headerName]: newToken,
          }
        }
      } catch (error) {
        console.warn('Failed to fetch CSRF token:', error)
      }
    } else {
      options.headers = {
        ...options.headers,
        [CSRF_CONFIG.headerName]: csrfToken,
      }
    }
  }
  
  // Ensure content-type is set for JSON requests
  if (options.body && typeof options.body === 'string') {
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  }
  
  // Always include credentials
  return fetch(url, {
    ...options,
    credentials: 'include',
  })
}

/**
 * Type-safe wrapper for JSON API requests with CSRF protection
 */
export async function secureApi<T = unknown>(
  url: string,
  options: RequestInit & { body?: unknown } = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await secureFetch(url, {
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
    
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')
    
    if (!response.ok) {
      if (isJson) {
        const error = await response.json()
        return { error: error.error || `Request failed with status ${response.status}` }
      }
      return { error: `Request failed with status ${response.status}` }
    }
    
    if (isJson) {
      const data = await response.json()
      return { data }
    }
    
    return { data: undefined as T }
  } catch (error) {
    console.error('API request failed:', error)
    return { error: error instanceof Error ? error.message : 'Request failed' }
  }
}