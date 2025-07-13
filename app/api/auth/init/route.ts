import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail } from '@/lib/auth'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Check if system admin already exists
    const existingAdmin = await getUserByEmail('admin@epixelmlm.com')
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'System admin already exists' },
        { status: 400 }
      )
    }

    // Create system admin user
    const systemAdmin = await createUser({
      email: 'admin@epixelmlm.com',
      name: 'System Administrator',
      password: 'admin123', // This should be changed on first login
      role: 'system_admin',
      whatsapp_number: '+1234567890' // Default WhatsApp number for system admin
    })

    return NextResponse.json({
      message: 'System admin created successfully',
      user: {
        id: systemAdmin.id,
        email: systemAdmin.email,
        name: systemAdmin.name,
        role: systemAdmin.role
      }
    })
  } catch (error) {
    console.error('Init error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 