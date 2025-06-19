import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createOrRefreshCSRFToken, setCSRFCookie } from '@/lib/security/csrf'

/**
 * GET /api/auth/csrf
 * 
 * Endpoint to get a CSRF token for the current session
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Create or refresh CSRF token
    const { token, expiresAt } = await createOrRefreshCSRFToken(session.user.id)
    
    // Create response
    const response = NextResponse.json({
      csrfToken: token,
      expiresAt: expiresAt.toISOString(),
    })
    
    // Set cookie for non-AJAX requests
    setCSRFCookie(response, token)
    
    return response
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}