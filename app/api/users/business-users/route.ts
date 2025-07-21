import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getBusinessUsers } from '@/lib/business-plan'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user has admin privileges
    if (decoded.role !== 'system_admin' && decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admins can view business users.' },
        { status: 403 }
      )
    }

    const businessUsers = await getBusinessUsers()

    return NextResponse.json(businessUsers)
  } catch (error) {
    console.error('Get business users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 