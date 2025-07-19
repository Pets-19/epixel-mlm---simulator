import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
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

    const { userIds } = await request.json()

    // Validation
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Validate that all IDs are numbers
    const validUserIds = userIds.filter(id => !isNaN(Number(id))).map(id => Number(id))
    if (validUserIds.length !== userIds.length) {
      return NextResponse.json(
        { error: 'All user IDs must be valid numbers' },
        { status: 400 }
      )
    }

    // Check if users exist and get their roles
    const userCheckQuery = 'SELECT id, role FROM users WHERE id = ANY($1)'
    const userCheckResult = await pool.query(userCheckQuery, [validUserIds])
    
    if (userCheckResult.rows.length === 0) {
      return NextResponse.json({ error: 'No valid users found' }, { status: 404 })
    }

    const usersToDelete = userCheckResult.rows
    const foundUserIds = usersToDelete.map(user => user.id)

    // Check for system_admin users that cannot be deleted
    const systemAdminUsers = usersToDelete.filter(user => user.role === 'system_admin')
    if (systemAdminUsers.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete system admin users',
          details: {
            systemAdminIds: systemAdminUsers.map(user => user.id),
            message: 'System admin users are protected from deletion'
          }
        },
        { status: 403 }
      )
    }

    // Check if user is trying to delete themselves
    if (foundUserIds.includes(decoded.userId)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      )
    }

    // Delete users
    const deleteQuery = 'DELETE FROM users WHERE id = ANY($1)'
    const result = await pool.query(deleteQuery, [foundUserIds])

    return NextResponse.json({
      message: `Successfully deleted ${result.rowCount} users`,
      deletedCount: result.rowCount,
      deletedUserIds: foundUserIds
    })
  } catch (error) {
    console.error('Error bulk deleting users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 