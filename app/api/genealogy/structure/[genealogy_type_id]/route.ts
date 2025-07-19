import { NextRequest, NextResponse } from 'next/server'

const GO_SERVICE_URL = process.env.GO_API_URL || 'http://localhost:8080'

export async function GET(
  request: NextRequest,
  { params }: { params: { genealogy_type_id: string } }
) {
  try {
    const { genealogy_type_id } = params

    const response = await fetch(
      `${GO_SERVICE_URL}/api/genealogy/structure/${genealogy_type_id}`,
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
    console.error('Error fetching genealogy structure:', error)
    return NextResponse.json(
      { error: 'Failed to fetch genealogy structure' },
      { status: 500 }
    )
  }
} 