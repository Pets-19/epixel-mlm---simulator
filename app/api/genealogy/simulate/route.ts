import { NextRequest, NextResponse } from 'next/server'

const GO_SERVICE_URL = process.env.GO_SERVICE_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Forward the request to the Go service
    const response = await fetch(`${GO_SERVICE_URL}/api/genealogy/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Go service responded with status: ${response.status}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error forwarding simulation request:', error)
    return NextResponse.json(
      { error: 'Simulation service unavailable' },
      { status: 503 }
    )
  }
} 