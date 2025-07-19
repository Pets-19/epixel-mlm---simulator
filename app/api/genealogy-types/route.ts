import { NextRequest, NextResponse } from 'next/server'

const GO_SERVICE_URL = process.env.GO_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${GO_SERVICE_URL}/api/genealogy/types`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Go service responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching genealogy types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch genealogy types' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${GO_SERVICE_URL}/api/genealogy/types`, {
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
    console.error('Error creating genealogy type:', error)
    return NextResponse.json(
      { error: 'Failed to create genealogy type' },
      { status: 500 }
    )
  }
} 