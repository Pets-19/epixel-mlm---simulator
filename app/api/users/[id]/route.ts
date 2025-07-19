import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'

// Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user has admin or system_admin role
    if (decoded.role !== 'admin' && decoded.role !== 'system_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const query = `
      SELECT id, email, name, role, whatsapp_number, organization_name, country, created_at, updated_at
      FROM users WHERE id = $1
    `
    
    const result = await pool.query(query, [userId])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: result.rows[0] })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user has admin or system_admin role
    if (decoded.role !== 'admin' && decoded.role !== 'system_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const { name, email, role, whatsapp_number, organization_name, country } = await request.json()

    // Validation
    const errors: string[] = []

    // Required fields
    if (!name || name.trim().length === 0) {
      errors.push('Full name is required')
    } else if (name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long')
    }

    if (!email || email.trim().length === 0) {
      errors.push('Email is required')
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.push('Please enter a valid email address')
      }
    }

    if (!role || !['admin', 'user'].includes(role)) {
      errors.push('Valid role is required (admin or user)')
    }

    // WhatsApp number validation (mandatory)
    if (!whatsapp_number || whatsapp_number.trim().length === 0) {
      errors.push('WhatsApp number is required')
    } else {
      const whatsappRegex = /^\+[1-9]\d{1,14}$/
      if (!whatsappRegex.test(whatsapp_number.trim())) {
        errors.push('WhatsApp number must be in international format (e.g., +1234567890)')
      }
    }

    // Organization name validation
    if (organization_name && organization_name.trim().length > 0) {
      if (organization_name.trim().length < 2) {
        errors.push('Organization name must be at least 2 characters long')
      }
    }

    // Country validation
    if (country && country.trim().length > 0) {
      if (country.trim().length < 2) {
        errors.push('Country name must be at least 2 characters long')
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    // Check if email already exists for another user
    const emailCheckQuery = 'SELECT id FROM users WHERE email = $1 AND id != $2'
    const emailCheckResult = await pool.query(emailCheckQuery, [email, userId])
    
    if (emailCheckResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists', details: ['A user with this email address already exists'] },
        { status: 400 }
      )
    }

    // Check if WhatsApp number already exists for another user
    const whatsappCheckQuery = 'SELECT id FROM users WHERE whatsapp_number = $1 AND id != $2'
    const whatsappCheckResult = await pool.query(whatsappCheckQuery, [whatsapp_number, userId])
    
    if (whatsappCheckResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'WhatsApp number already exists', details: ['A user with this WhatsApp number already exists'] },
        { status: 400 }
      )
    }

    // Update user
    const updateQuery = `
      UPDATE users 
      SET name = $1, email = $2, role = $3, whatsapp_number = $4, organization_name = $5, country = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING id, email, name, role, whatsapp_number, organization_name, country, created_at, updated_at
    `
    
    const result = await pool.query(updateQuery, [
      name, email, role, whatsapp_number, organization_name || null, country || null, userId
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: result.rows[0] })
  } catch (error) {
    console.error('Error updating user:', error)
    
    // Handle database constraint violations
    if (error instanceof Error) {
      if (error.message.includes('users_email_key')) {
        return NextResponse.json(
          { error: 'Email already exists', details: ['A user with this email address already exists'] },
          { status: 400 }
        )
      }
      if (error.message.includes('users_whatsapp_number_unique')) {
        return NextResponse.json(
          { error: 'WhatsApp number already exists', details: ['A user with this WhatsApp number already exists'] },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user has admin or system_admin role
    if (decoded.role !== 'admin' && decoded.role !== 'system_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Check if user exists and get their role
    const userCheckQuery = 'SELECT id, role FROM users WHERE id = $1'
    const userCheckResult = await pool.query(userCheckQuery, [userId])
    
    if (userCheckResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userToDelete = userCheckResult.rows[0]

    // Prevent deletion of system_admin users
    if (userToDelete.role === 'system_admin') {
      return NextResponse.json(
        { error: 'Cannot delete system admin users' },
        { status: 403 }
      )
    }

    // Prevent users from deleting themselves
    if (decoded.userId === userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      )
    }

    // Delete user
    const deleteQuery = 'DELETE FROM users WHERE id = $1'
    const result = await pool.query(deleteQuery, [userId])

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 