import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createUser, getUserByEmail, getUserByWhatsAppNumber } from '@/lib/auth'

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
        { error: 'Insufficient permissions. Only admins can create users.' },
        { status: 403 }
      )
    }

    const { 
      name, 
      email, 
      password, 
      role, 
      whatsapp_number, 
      organization_name, 
      country 
    } = await request.json()

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

    if (!password || password.length === 0) {
      errors.push('Password is required')
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters long')
    }

    if (!role || !['system_admin', 'admin', 'user'].includes(role)) {
      errors.push('Valid role is required (system_admin, admin, or user)')
    }

    // Role restrictions
    if (decoded.role === 'admin' && role === 'system_admin') {
      errors.push('Admins cannot create system administrators')
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

    // Check if email already exists
    const existingUserByEmail = await getUserByEmail(email.trim())
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email already exists', details: ['A user with this email address already exists'] },
        { status: 400 }
      )
    }

    // Check if WhatsApp number already exists
    const existingUserByWhatsApp = await getUserByWhatsAppNumber(whatsapp_number.trim())
    if (existingUserByWhatsApp) {
      return NextResponse.json(
        { error: 'WhatsApp number already exists', details: ['A user with this WhatsApp number already exists'] },
        { status: 400 }
      )
    }

    // Create the user
    const newUser = await createUser({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      whatsapp_number: whatsapp_number.trim(),
      organization_name: organization_name?.trim() || undefined,
      country: country?.trim() || undefined
    })

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        whatsapp_number: newUser.whatsapp_number,
        organization_name: newUser.organization_name,
        country: newUser.country,
        created_at: newUser.created_at
      }
    })
  } catch (error) {
    console.error('Create user error:', error)
    
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