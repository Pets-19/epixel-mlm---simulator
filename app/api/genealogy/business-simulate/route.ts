import { NextRequest, NextResponse } from 'next/server'

const GO_SERVICE_URL = process.env.GO_API_URL || 'http://genealogy-simulator:8080'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Business simulation request:', JSON.stringify(body, null, 2))
    console.log('GO_SERVICE_URL:', GO_SERVICE_URL)
    
    // Validate products before sending
    if (!body.products || body.products.length === 0) {
      return NextResponse.json(
        { error: 'At least one product is required for simulation. Please add products in Step 2.' },
        { status: 400 }
      )
    }

    // Validate sales ratios add up to 100%
    const totalSalesRatio = body.products.reduce((sum: number, p: any) => sum + (p.product_sales_ratio || 0), 0)
    if (totalSalesRatio < 99.99 || totalSalesRatio > 100.01) {
      return NextResponse.json(
        { error: `Product sales ratios must total 100%. Current total: ${totalSalesRatio.toFixed(2)}%` },
        { status: 400 }
      )
    }

    // Validate other required fields
    if (!body.max_expected_users || body.max_expected_users <= 0) {
      return NextResponse.json(
        { error: 'Maximum expected users must be greater than 0' },
        { status: 400 }
      )
    }

    if (!body.number_of_payout_cycles || body.number_of_payout_cycles <= 0) {
      return NextResponse.json(
        { error: 'Number of payout cycles must be greater than 0' },
        { status: 400 }
      )
    }
    
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
      const errorMessage = responseText || 'Go simulation service returned an error'
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = JSON.parse(responseText)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Business simulation proxy error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check if it's a connection error
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Simulation service is currently unavailable. It may be starting up (takes ~50 seconds on free tier). Please try again in a moment.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to connect to simulation service', details: errorMessage },
      { status: 500 }
    )
  }
}
