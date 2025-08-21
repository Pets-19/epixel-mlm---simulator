import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { 
  getBusinessPlanById, 
  updateBusinessPlan, 
  deleteBusinessPlan,
  BusinessPlanUpdate 
} from '@/lib/business-plan'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid business plan ID' },
        { status: 400 }
      )
    }

    const businessPlan = await getBusinessPlanById(id)
    
    if (!businessPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (decoded.role === 'business_user' && businessPlan.user_id !== decoded.id) {
      return NextResponse.json(
        { error: 'You can only view your own business plans' },
        { status: 403 }
      )
    }

    return NextResponse.json(businessPlan)
  } catch (error) {
    console.error('Get business plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Insufficient permissions. Only admins can update business plans.' },
        { status: 403 }
      )
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid business plan ID' },
        { status: 400 }
      )
    }

    const data: BusinessPlanUpdate = await request.json()

    // Validation
    const errors: string[] = []

    if (data.business_name !== undefined) {
      if (!data.business_name || data.business_name.trim().length === 0) {
        errors.push('Business name is required')
      } else if (data.business_name.trim().length < 2) {
        errors.push('Business name must be at least 2 characters long')
      }
    }

    if (data.status !== undefined && !['draft', 'active', 'completed', 'cancelled'].includes(data.status)) {
      errors.push('Invalid status value')
    }

    if (data.products !== undefined) {
      if (data.products.length === 0) {
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
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    // Update the business plan
    const updatedPlan = await updateBusinessPlan(id, {
      ...data,
      business_name: data.business_name?.trim()
    })

    if (!updatedPlan) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Business plan updated successfully',
      business_plan: updatedPlan
    })
  } catch (error) {
    console.error('Update business plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Insufficient permissions. Only admins can delete business plans.' },
        { status: 403 }
      )
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid business plan ID' },
        { status: 400 }
      )
    }

    const success = await deleteBusinessPlan(id)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Business plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Business plan deleted successfully'
    })
  } catch (error) {
    console.error('Delete business plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 