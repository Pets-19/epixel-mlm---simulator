import { NextRequest, NextResponse } from 'next/server'

const GO_SERVICE_URL = process.env.GO_API_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${GO_SERVICE_URL}/api/genealogy/generate-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Go service responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error generating users:', error)
    return NextResponse.json(
      { error: 'Failed to generate users' },
      { status: 500 }
    )
  }
} 