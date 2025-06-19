/**
 * Example of a fully secured API route using the integrated security system
 * 
 * This demonstrates how to use all security features together:
 * - Authentication requirement
 * - CSRF protection
 * - Role-based access control
 * - Security headers
 * - Error handling
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSecuredHandler } from '@/lib/security/integration'
import { z } from 'zod'

// Define request schema for validation
const requestSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  data: z.object({
    name: z.string().min(1).max(100),
    value: z.number().positive(),
  }),
})

/**
 * GET /api/example-secured
 * 
 * Public endpoint - no authentication required
 * Demonstrates conditional security based on method
 */
export async function GET(request: NextRequest) {
  // Public data - no security checks needed
  return NextResponse.json({
    message: 'This is public data',
    timestamp: new Date().toISOString(),
  })
}

/**
 * POST /api/example-secured
 * 
 * Secured endpoint requiring:
 * - Authentication
 * - CSRF token
 * - Premium role or higher
 */
export const POST = createSecuredHandler(
  {
    requireAuth: true,
    requireRoles: ['premium', 'moderator', 'admin'],
    requireCSRF: true,
  },
  async (request, context) => {
    // Context provides all security information
    const { userId, userEmail, userRole } = context
    
    try {
      // Parse and validate request body
      const body = await request.json()
      const validatedData = requestSchema.parse(body)
      
      // Log the action for audit trail
      console.log('Secured action performed:', {
        userId,
        userEmail,
        userRole,
        action: validatedData.action,
        timestamp: new Date().toISOString(),
      })
      
      // Perform role-specific logic
      let responseMessage = `Action '${validatedData.action}' performed successfully`
      
      if (userRole === 'admin') {
        responseMessage += ' (Admin privileges applied)'
      } else if (userRole === 'moderator') {
        responseMessage += ' (Moderator privileges applied)'
      }
      
      // Simulate some business logic
      const result = {
        success: true,
        message: responseMessage,
        data: {
          id: crypto.randomUUID(),
          ...validatedData.data,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        },
        metadata: {
          userRole,
          requestId: request.headers.get('X-Request-ID'),
        },
      }
      
      return NextResponse.json(result, { status: 201 })
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors,
          },
          { status: 400 }
        )
      }
      
      console.error('Secured endpoint error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

/**
 * DELETE /api/example-secured
 * 
 * Admin-only endpoint with full security
 */
export const DELETE = createSecuredHandler(
  {
    requireAuth: true,
    requireRoles: ['admin'],
    requireCSRF: true,
  },
  async (request, context) => {
    const { userId, userRole } = context
    
    // Only admins can reach this point
    console.log('Admin action performed:', {
      userId,
      userRole,
      action: 'delete',
      timestamp: new Date().toISOString(),
    })
    
    return NextResponse.json({
      success: true,
      message: 'Resource deleted by admin',
      deletedBy: userId,
    })
  }
)

/**
 * OPTIONS /api/example-secured
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}