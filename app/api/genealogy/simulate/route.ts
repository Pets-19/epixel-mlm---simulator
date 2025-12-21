import { NextRequest, NextResponse } from 'next/server'

const GO_SERVICE_URL = process.env.GO_API_URL || 'http://localhost:8080'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== Genealogy Simulation Request ===')
    console.log('GO_SERVICE_URL:', GO_SERVICE_URL)
    console.log('Request body:', JSON.stringify(body, null, 2))

    // Forward the request to the Go service
    const response = await fetch(`${GO_SERVICE_URL}/api/genealogy/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const responseText = await response.text()
    console.log('Go service response status:', response.status)
    console.log('Go service response:', responseText)

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'Simulation failed', 
          details: responseText || `Go service responded with status: ${response.status}`,
          go_service_url: GO_SERVICE_URL
        },
        { status: response.status }
      )
    }

    const result = JSON.parse(responseText)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error forwarding simulation request:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check for connection errors
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
      return NextResponse.json(
        { 
          error: 'Simulation service is currently unavailable',
          details: 'The Go service may be starting up (takes ~50 seconds on free tier). Please try again in a moment.',
          go_service_url: GO_SERVICE_URL,
          technical_error: errorMessage
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Simulation failed',
        details: errorMessage,
        go_service_url: GO_SERVICE_URL
      },
      { status: 500 }
    )
  }
} 