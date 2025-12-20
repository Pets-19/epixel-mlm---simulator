import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const simulationId = params.id

    // Fetch simulation from database
    const query = `
      SELECT 
        id,
        simulation_type,
        config,
        result,
        user_id,
        created_at
      FROM genealogy_simulations
      WHERE id = $1
    `
    
    const result = await pool.query(query, [simulationId])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Simulation not found' },
        { status: 404 }
      )
    }

    const simulation = result.rows[0]
    const config = simulation.config || {}
    const simulationResult = simulation.result || {}

    // Parse tree structure from result
    const tree = simulationResult.tree || null
    const totalMembers = simulationResult.total_members || simulationResult.totalMembers || config.num_users || 0
    const totalLevels = simulationResult.total_levels || simulationResult.depth || config.depth || 0

    return NextResponse.json({
      id: simulation.id,
      tree: tree,
      total_members: totalMembers,
      total_levels: totalLevels,
      genealogy_type: simulation.simulation_type || config.genealogy_type || 'unknown',
      config: config,
      result: simulationResult,
      created_at: simulation.created_at
    })
  } catch (error) {
    console.error('Get simulation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
