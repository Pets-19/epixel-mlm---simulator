import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { 
  createBusinessPlan, 
  getAllBusinessPlans, 
  getBusinessPlansByUserId,
  BusinessPlanCreate 
} from '@/lib/business-plan'

export async function POST(request: NextRequest) {
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
        { error: 'Insufficient permissions. Only admins can create business plans.' },
        { status: 403 }
      )
    }

    const data: BusinessPlanCreate = await request.json()

    // Validation
    const errors: string[] = []

    if (!data.user_id || data.user_id <= 0) {
      errors.push('Valid user ID is required')
    }

    if (!data.business_name || data.business_name.trim().length === 0) {
      errors.push('Business name is required')
    } else if (data.business_name.trim().length < 2) {
      errors.push('Business name must be at least 2 characters long')
    }

    if (!data.products || data.products.length === 0) {
      errors.push('At least one product is required')
    } else {
      // Validate each product
      data.products.forEach((product, index) => {
        if (!product.product_name || product.product_name.trim().length === 0) {
          errors.push(`Product ${index + 1}: Product name is required`)
        } else if (product.product_name.trim().length < 2) {
          errors.push(`Product ${index + 1}: Product name must be at least 2 characters long`)
        }

        if (!product.product_price || product.product_price <= 0) {
          errors.push(`Product ${index + 1}: Valid product price is required`)
        }

        if (product.business_volume < 0) {
          errors.push(`Product ${index + 1}: Business volume cannot be negative`)
        }

        if (!product.product_sales_ratio || product.product_sales_ratio < 0 || product.product_sales_ratio > 100) {
          errors.push(`Product ${index + 1}: Product sales ratio must be between 0 and 100`)
        }

        if (!product.product_type || !['membership', 'retail', 'digital'].includes(product.product_type)) {
          errors.push(`Product ${index + 1}: Valid product type is required (membership, retail, or digital)`)
        }
      })
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    // Create the business plan
    const businessPlan = await createBusinessPlan({
      ...data,
      business_name: data.business_name.trim(),
      products: data.products.map(product => ({
        ...product,
        product_name: product.product_name.trim()
      }))
    })

    return NextResponse.json({
      message: 'Business plan created successfully',
      business_plan: businessPlan
    })
  } catch (error) {
    console.error('Create business plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    let businessPlans

    if (userId) {
      // Get business plans for specific user
      if (decoded.role === 'business_user' && parseInt(userId) !== decoded.id) {
        return NextResponse.json(
          { error: 'You can only view your own business plans' },
          { status: 403 }
        )
      }
      businessPlans = await getBusinessPlansByUserId(parseInt(userId))
    } else {
      // Get all business plans (admin only)
      if (decoded.role === 'business_user') {
        return NextResponse.json(
          { error: 'You can only view your own business plans' },
          { status: 403 }
        )
      }
      businessPlans = await getAllBusinessPlans()
    }

    return NextResponse.json(businessPlans)
  } catch (error) {
    console.error('Get business plans error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 