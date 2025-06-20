import { NextRequest, NextResponse } from 'next/server'
import { withRoleAuth } from '@/lib/rbac'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  return withRoleAuth(request, ['admin'], async (req, userId, userRole) => {
    try {
      const searchParams = req.nextUrl.searchParams
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const search = searchParams.get('search') || ''
      const role = searchParams.get('role') as Database['public']['Tables']['profiles']['Row']['role'] | null
      const status = searchParams.get('status') as 'active' | 'inactive' | null

      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get: () => null,
            set: () => {},
            remove: () => {},
          },
        }
      )

      // Build query
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false })

      // Apply filters
      if (search) {
        query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,full_name.ilike.%${search}%`)
      }
      
      if (role) {
        query = query.eq('role', role)
      }
      
      if (status === 'active') {
        query = query.eq('is_active', true)
      } else if (status === 'inactive') {
        query = query.eq('is_active', false)
      }

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      return NextResponse.json({
        users: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  })
}

// PATCH /api/admin/users/:id - Update user (admin only)
export async function PATCH(request: NextRequest) {
  return withRoleAuth(request, ['admin'], async (req, adminId, userRole) => {
    try {
      const body = await req.json()
      const { userId, updates } = body

      if (!userId) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'User ID is required' },
          { status: 400 }
        )
      }

      // Prevent admin from modifying their own role
      if (userId === adminId && updates.role) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Cannot modify your own role' },
          { status: 403 }
        )
      }

      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get: () => null,
            set: () => {},
            remove: () => {},
          },
        }
      )

      // Validate allowed updates
      const allowedUpdates = [
        'role',
        'is_active',
        'is_verified',
        'subscription_tier',
        'subscription_expires_at',
        'daily_investment_limit',
        'monthly_investment_limit',
      ]

      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key]
          return obj
        }, {} as Record<string, unknown>)

      if (Object.keys(filteredUpdates).length === 0) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'No valid updates provided' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...filteredUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return NextResponse.json({
        message: 'User updated successfully',
        user: data,
      })
    } catch (error) {
      console.error('Error updating user:', error)
      return NextResponse.json(
        { error: 'Failed to update user', message: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  })
}