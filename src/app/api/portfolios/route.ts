import { type NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { PortfolioService } from '@/lib/portfolio/portfolio.service'
import { validateCSRFProtection } from '@/lib/security/csrf'

const createPortfolioSchema = z.object({
  name: z.string().min(1).max(100),
  currency: z.string().length(3).optional(),
  target_allocation: z.record(z.number()).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const portfolios = await PortfolioService.getPortfolios(session.user.id)
    
    return NextResponse.json({ portfolios })
  } catch (error) {
    console.error('Error fetching portfolios:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolios' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token
    const csrfValidation = await validateCSRFProtection(request)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: csrfValidation.error || 'CSRF validation failed' },
        { status: csrfValidation.error === 'Unauthorized' ? 401 : 403 }
      )
    }
    
    const session = csrfValidation.session || await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const validatedData = createPortfolioSchema.parse(body)
    
    const portfolio = await PortfolioService.createPortfolio(
      session.user.id,
      validatedData
    )
    
    return NextResponse.json({ portfolio }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message.includes('Maximum portfolio limit')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    console.error('Error creating portfolio:', error)
    return NextResponse.json(
      { error: 'Failed to create portfolio' },
      { status: 500 }
    )
  }
}