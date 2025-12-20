import { NextRequest, NextResponse } from 'next/server'

const GO_SERVICE_URL = process.env.GO_API_URL || 'http://genealogy-simulator:8080'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Business simulation request:', JSON.stringify(body, null, 2))
    
    const response = await fetch(`${GO_SERVICE_URL}/api/genealogy/business-simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    const responseText = await response.text()
    console.log('Go service response status:', response.status)
    console.log('Go service response:', responseText)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Simulation failed: ${responseText}` },
        { status: response.status }
      )
    }

    const data = JSON.parse(responseText)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Business simulation proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to simulation service', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
