import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getServerSession } from 'next-auth'
import {
  hasRole,
  getUserRole,
  checkRouteAccess,
  withRoleAuth,
  routeRoleConfig,
  type UserRole,
} from '../rbac'

// Mock dependencies
jest.mock('@supabase/ssr')
jest.mock('next-auth')

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('RBAC (Role-Based Access Control)', () => {
  const mockUserId = 'user-123'
  const mockSession = {
    user: {
      id: mockUserId,
      email: 'test@example.com',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hasRole', () => {
    it('should return true for direct role match', () => {
      expect(hasRole('admin', ['admin'])).toBe(true)
      expect(hasRole('moderator', ['moderator', 'admin'])).toBe(true)
      expect(hasRole('user', ['user'])).toBe(true)
    })

    it('should return false for no role', () => {
      expect(hasRole(null, ['admin'])).toBe(false)
    })

    it('should respect role hierarchy', () => {
      // Admin should have access to all lower roles
      expect(hasRole('admin', ['user'])).toBe(true)
      expect(hasRole('admin', ['premium'])).toBe(true)
      expect(hasRole('admin', ['moderator'])).toBe(true)
      
      // Moderator should have access to user and premium
      expect(hasRole('moderator', ['user'])).toBe(true)
      expect(hasRole('moderator', ['premium'])).toBe(true)
      expect(hasRole('moderator', ['admin'])).toBe(false)
      
      // User should only have access to user role
      expect(hasRole('user', ['admin'])).toBe(false)
      expect(hasRole('user', ['moderator'])).toBe(false)
      expect(hasRole('user', ['premium'])).toBe(false)
    })

    it('should handle multiple required roles', () => {
      // Admin has access when either admin or moderator is required
      expect(hasRole('admin', ['admin', 'moderator'])).toBe(true)
      
      // Moderator has access when either moderator or user is required
      expect(hasRole('moderator', ['moderator', 'user'])).toBe(true)
      
      // User doesn't have access when admin or moderator is required
      expect(hasRole('user', ['admin', 'moderator'])).toBe(false)
    })
  })

  describe('getUserRole', () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }

    beforeEach(() => {
      mockCreateServerClient.mockReturnValue(mockSupabase as any)
    })

    it('should fetch user role from database', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null,
      })

      const role = await getUserRole(mockUserId)
      
      expect(role).toBe('admin')
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSupabase.select).toHaveBeenCalledWith('role')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockUserId)
    })

    it('should return null on database error', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      })

      const role = await getUserRole(mockUserId)
      
      expect(role).toBeNull()
    })

    it('should return null if no role in data', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {},
        error: null,
      })

      const role = await getUserRole(mockUserId)
      
      expect(role).toBeNull()
    })

    it('should handle missing Supabase credentials', async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const role = await getUserRole(mockUserId)
      
      expect(role).toBeNull()
      expect(mockCreateServerClient).not.toHaveBeenCalled()
      
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    })
  })

  describe('checkRouteAccess', () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }

    beforeEach(() => {
      mockCreateServerClient.mockReturnValue(mockSupabase as any)
    })

    it('should allow access to unrestricted routes', async () => {
      const result = await checkRouteAccess('/public/page', mockUserId)
      
      expect(result.hasAccess).toBe(true)
      expect(result.redirectPath).toBeUndefined()
      expect(result.reason).toBeUndefined()
    })

    it('should require authentication for protected routes', async () => {
      const result = await checkRouteAccess('/admin', null)
      
      expect(result.hasAccess).toBe(false)
      expect(result.redirectPath).toBe('/auth/signin')
      expect(result.reason).toBe('Authentication required')
    })

    it('should check role for admin routes', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'user' },
        error: null,
      })

      const result = await checkRouteAccess('/admin/users', mockUserId)
      
      expect(result.hasAccess).toBe(false)
      expect(result.redirectPath).toBe('/dashboard')
      expect(result.reason).toBe('Required role: admin')
    })

    it('should allow admin access to admin routes', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null,
      })

      const result = await checkRouteAccess('/admin/users', mockUserId)
      
      expect(result.hasAccess).toBe(true)
      expect(result.redirectPath).toBeUndefined()
    })

    it('should handle routes with multiple allowed roles', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'moderator' },
        error: null,
      })

      const result = await checkRouteAccess('/admin/analytics', mockUserId)
      
      expect(result.hasAccess).toBe(true)
    })

    it('should use most specific route configuration', async () => {
      // '/admin/users' is more specific than '/admin'
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'moderator' },
        error: null,
      })

      const result = await checkRouteAccess('/admin/users/edit', mockUserId)
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('Required role: admin')
    })
  })

  describe('withRoleAuth', () => {
    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    )
    
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }

    beforeEach(() => {
      mockCreateServerClient.mockReturnValue(mockSupabase as any)
      mockHandler.mockClear()
    })

    it('should require authentication', async () => {
      mockGetServerSession.mockResolvedValueOnce(null)
      
      const request = new NextRequest('http://localhost/api/admin/test')
      const response = await withRoleAuth(request, ['admin'], mockHandler)
      const body = await response.json()
      
      expect(response.status).toBe(401)
      expect(body.error).toBe('Unauthorized')
      expect(body.message).toBe('Authentication required')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should check user role', async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession as any)
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'user' },
        error: null,
      })
      
      const request = new NextRequest('http://localhost/api/admin/test')
      const response = await withRoleAuth(request, ['admin'], mockHandler)
      const body = await response.json()
      
      expect(response.status).toBe(403)
      expect(body.error).toBe('Forbidden')
      expect(body.message).toBe('Required role: admin')
      expect(body.currentRole).toBe('user')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should allow access with correct role', async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession as any)
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null,
      })
      
      const request = new NextRequest('http://localhost/api/admin/test')
      const response = await withRoleAuth(request, ['admin'], mockHandler)
      const body = await response.json()
      
      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(mockHandler).toHaveBeenCalledWith(request, mockUserId, 'admin')
    })

    it('should allow access with higher role in hierarchy', async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession as any)
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null,
      })
      
      const request = new NextRequest('http://localhost/api/moderator/test')
      const response = await withRoleAuth(request, ['moderator'], mockHandler)
      
      expect(response.status).toBe(200)
      expect(mockHandler).toHaveBeenCalledWith(request, mockUserId, 'admin')
    })

    it('should handle multiple allowed roles', async () => {
      mockGetServerSession.mockResolvedValueOnce(mockSession as any)
      mockSupabase.single.mockResolvedValueOnce({
        data: { role: 'moderator' },
        error: null,
      })
      
      const request = new NextRequest('http://localhost/api/content/test')
      const response = await withRoleAuth(request, ['admin', 'moderator'], mockHandler)
      
      expect(response.status).toBe(200)
      expect(mockHandler).toHaveBeenCalledWith(request, mockUserId, 'moderator')
    })

    it('should handle errors gracefully', async () => {
      mockGetServerSession.mockRejectedValueOnce(new Error('Session error'))
      
      const request = new NextRequest('http://localhost/api/admin/test')
      const response = await withRoleAuth(request, ['admin'], mockHandler)
      const body = await response.json()
      
      expect(response.status).toBe(500)
      expect(body.error).toBe('Internal Server Error')
      expect(body.message).toBe('Authentication check failed')
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('Route Configuration', () => {
    it('should have admin-only routes configured', () => {
      expect(routeRoleConfig['/admin'].allowedRoles).toEqual(['admin'])
      expect(routeRoleConfig['/admin/users'].allowedRoles).toEqual(['admin'])
      expect(routeRoleConfig['/api/admin'].allowedRoles).toEqual(['admin'])
      expect(routeRoleConfig['/api/admin/users'].allowedRoles).toEqual(['admin'])
    })

    it('should have mixed role routes configured', () => {
      expect(routeRoleConfig['/admin/analytics'].allowedRoles).toEqual(['admin', 'moderator'])
      expect(routeRoleConfig['/admin/content'].allowedRoles).toEqual(['admin', 'moderator'])
      expect(routeRoleConfig['/api/admin/metrics'].allowedRoles).toEqual(['admin', 'moderator'])
    })

    it('should have authentication requirements', () => {
      Object.values(routeRoleConfig).forEach(config => {
        expect(config.requireAuth).toBe(true)
      })
    })

    it('should have appropriate redirect paths', () => {
      expect(routeRoleConfig['/admin'].redirectPath).toBe('/dashboard')
      expect(routeRoleConfig['/admin/users'].redirectPath).toBe('/dashboard')
      expect(routeRoleConfig['/api/admin'].redirectPath).toBeUndefined() // API routes don't redirect
    })
  })
})