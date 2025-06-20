import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from './auth'
import type { Database } from '@/types/database.types'
import { logError, logWarn } from '@/lib/monitoring/edge-logger'

export type UserRole = Database['public']['Tables']['profiles']['Row']['role']

interface RoleConfig {
  allowedRoles: UserRole[]
  redirectPath?: string
  requireAuth?: boolean
}

// Define role hierarchies
const roleHierarchy: Record<UserRole, number> = {
  user: 1,
  premium: 2,
  moderator: 3,
  admin: 4,
}

// Define route role configurations
export const routeRoleConfig: Record<string, RoleConfig> = {
  '/admin': {
    allowedRoles: ['admin'],
    redirectPath: '/dashboard',
    requireAuth: true,
  },
  '/admin/users': {
    allowedRoles: ['admin'],
    redirectPath: '/dashboard',
    requireAuth: true,
  },
  '/admin/analytics': {
    allowedRoles: ['admin', 'moderator'],
    redirectPath: '/dashboard',
    requireAuth: true,
  },
  '/admin/content': {
    allowedRoles: ['admin', 'moderator'],
    redirectPath: '/dashboard',
    requireAuth: true,
  },
  '/api/admin': {
    allowedRoles: ['admin'],
    requireAuth: true,
  },
  '/api/admin/users': {
    allowedRoles: ['admin'],
    requireAuth: true,
  },
  '/api/admin/metrics': {
    allowedRoles: ['admin', 'moderator'],
    requireAuth: true,
  },
}

// Check if a user has the required role
export function hasRole(userRole: UserRole | null, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false
  
  // Check direct role match
  if (requiredRoles.includes(userRole)) return true
  
  // Check if user has a higher role in the hierarchy
  const userLevel = roleHierarchy[userRole] || 0
  const requiredLevel = Math.min(...requiredRoles.map(role => roleHierarchy[role] || 0))
  
  return userLevel >= requiredLevel
}

// Get user role from Supabase
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logError(new Error('Supabase credentials not configured'))
      return null
    }

    // Dynamic import to avoid server/client bundling issues
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      logError(new Error('Error fetching user role'), { error })
      return null
    }

    return data?.role || null
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Error in getUserRole'), { error })
    return null
  }
}

// Check route access based on role
export async function checkRouteAccess(
  pathname: string,
  userId: string | null
): Promise<{
  hasAccess: boolean
  redirectPath?: string
  reason?: string
}> {
  // Find the most specific route config
  const routeConfig = Object.entries(routeRoleConfig)
    .filter(([route]) => pathname.startsWith(route))
    .sort(([a], [b]) => b.length - a.length)[0]

  if (!routeConfig) {
    // No role restriction for this route
    return { hasAccess: true }
  }

  const [_route, config] = routeConfig

  // Check if authentication is required
  if (config.requireAuth && !userId) {
    return {
      hasAccess: false,
      redirectPath: '/auth/signin',
      reason: 'Authentication required',
    }
  }

  // Check role requirements
  if (config.allowedRoles.length > 0 && userId) {
    const userRole = await getUserRole(userId)
    
    if (!hasRole(userRole, config.allowedRoles)) {
      return {
        hasAccess: false,
        redirectPath: config.redirectPath || '/dashboard',
        reason: `Required role: ${config.allowedRoles.join(' or ')}`,
      }
    }
  }

  return { hasAccess: true }
}

// Middleware helper for API routes - Edge Runtime compatible
export async function withRoleAuth(
  request: NextRequest,
  requiredRoles: UserRole[],
  handler: (req: NextRequest, userId: string, userRole: UserRole) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get user ID from request headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      // Try to get from Supabase directly
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        )
      }
      
      // Use the user ID from Supabase
      const userIdFromAuth = user.id
      
      // Get user role
      const userRole = await getUserRole(userIdFromAuth)
      
      if (!userRole || !hasRole(userRole, requiredRoles)) {
        return NextResponse.json(
          { 
            error: 'Forbidden', 
            message: `Required role: ${requiredRoles.join(' or ')}`,
            currentRole: userRole 
          },
          { status: 403 }
        )
      }

      // Call the handler with authenticated user info
      return await handler(request, userIdFromAuth, userRole)
    }

    // Get user role
    const userRole = await getUserRole(userId)
    
    if (!userRole || !hasRole(userRole, requiredRoles)) {
      return NextResponse.json(
        { 
          error: 'Forbidden', 
          message: `Required role: ${requiredRoles.join(' or ')}`,
          currentRole: userRole 
        },
        { status: 403 }
      )
    }

    // Call the handler with authenticated user info
    return await handler(request, userId, userRole)
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Role auth error'), { error })
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Authentication check failed' },
      { status: 500 }
    )
  }
}

// React hook helper for client-side role checking
export function useRoleCheck(_requiredRoles: UserRole[]): {
  loading: boolean
  hasAccess: boolean
  userRole: UserRole | null
} {
  // This would be implemented with a context provider
  // For now, return a placeholder
  return {
    loading: false,
    hasAccess: false,
    userRole: null,
  }
}