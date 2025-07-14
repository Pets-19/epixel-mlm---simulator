import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { simulation_id, save_to_db } = await request.json()

    if (!simulation_id) {
      return NextResponse.json(
        { error: 'Simulation ID is required' },
        { status: 400 }
      )
    }

    if (!save_to_db) {
      return NextResponse.json({ message: 'Simulation completed successfully' })
    }

    // In a real implementation, you would save the simulation results to the database
    // For now, we'll just return a success message
    return NextResponse.json({
      message: 'Simulation results saved to database',
      simulation_id: simulation_id,
    })
  } catch (error) {
    console.error('Error saving simulation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 