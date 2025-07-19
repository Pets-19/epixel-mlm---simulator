import { NextRequest, NextResponse } from 'next/server'

const GO_SERVICE_URL = process.env.GO_API_URL || 'http://localhost:8080'

export async function GET(
  request: NextRequest,
  { params }: { params: { parent_id: string } }
) {
  try {
    const { parent_id } = params
    const { searchParams } = new URL(request.url)
    const genealogyTypeId = searchParams.get('genealogy_type_id')
    
    if (!genealogyTypeId) {
      return NextResponse.json(
        { error: 'Genealogy type ID is required' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${GO_SERVICE_URL}/api/genealogy/downline/${parent_id}?genealogy_type_id=${genealogyTypeId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Go service responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching downline users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch downline users' },
      { status: 500 }
    )
  }
} 