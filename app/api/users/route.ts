import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'DESC'

    const offset = (page - 1) * limit

    // Build the query with filters
    let query = `
      SELECT id, email, name, role, whatsapp_number, organization_name, country, created_at, updated_at
      FROM users
      WHERE 1=1
    `
    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR organization_name ILIKE $${paramIndex})`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (role && role !== 'all') {
      query += ` AND role = $${paramIndex}`
      queryParams.push(role)
      paramIndex++
    }

    // Add sorting
    const allowedSortFields = ['name', 'email', 'role', 'created_at', 'updated_at']
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at'
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    
    query += ` ORDER BY ${sortField} ${order}`

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      WHERE 1=1
      ${search ? `AND (name ILIKE $1 OR email ILIKE $1 OR organization_name ILIKE $1)` : ''}
      ${role && role !== 'all' ? `AND role = $${search ? '2' : '1'}` : ''}
    `
    const countParams = search ? [search] : []
    if (role && role !== 'all') countParams.push(role)

    const countResult = await pool.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].total)

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    queryParams.push(limit, offset)

    const result = await pool.query(query, queryParams)

    return NextResponse.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 