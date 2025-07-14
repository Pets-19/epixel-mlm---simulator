import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const query = `
      SELECT id, name, description, max_children_per_node, rules, is_active, created_at, updated_at
      FROM genealogy_types
      WHERE is_active = true
      ORDER BY name
    `
    
    const result = await pool.query(query)
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching genealogy types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, max_children_per_node, rules } = await request.json()

    if (!name || !description || !max_children_per_node) {
      return NextResponse.json(
        { error: 'Name, description, and max_children_per_node are required' },
        { status: 400 }
      )
    }

    const query = `
      INSERT INTO genealogy_types (name, description, max_children_per_node, rules, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, description, max_children_per_node, rules, is_active, created_at, updated_at
    `
    
    const values = [name, description, max_children_per_node, JSON.stringify(rules || {})]
    const result = await pool.query(query, values)
    
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error creating genealogy type:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 