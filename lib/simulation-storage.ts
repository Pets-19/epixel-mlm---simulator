import pool from './db'
import { SimulationResult, SimulationUser } from './simulation-engine'

export interface StoredSimulation {
  id: string
  genealogy_type: string
  max_expected_users: number
  payout_cycle: string
  number_of_payout_cycles: number
  max_children_count: number
  products: any
  users: any
  genealogy_structure: any
  simulation_summary: any
  created_at: Date
  updated_at: Date
}

export class SimulationStorage {
  /**
   * Save simulation result to database
   */
  static async saveSimulation(simulation: SimulationResult): Promise<string> {
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // Save simulation configuration
      const simulationQuery = `
        INSERT INTO genealogy_simulations (
          id, genealogy_type, max_expected_users, payout_cycle, 
          number_of_payout_cycles, max_children_count, products, 
          users, genealogy_structure, simulation_summary, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `
      
      const simulationResult = await client.query(simulationQuery, [
        simulation.id,
        simulation.genealogy_type,
        simulation.max_expected_users,
        simulation.payout_cycle,
        simulation.number_of_payout_cycles,
        simulation.max_children_count,
        JSON.stringify(simulation.products),
        JSON.stringify(simulation.users),
        JSON.stringify(simulation.genealogy_structure),
        JSON.stringify(simulation.simulation_summary),
        simulation.created_at,
        simulation.updated_at
      ])
      
      await client.query('COMMIT')
      
      return simulationResult.rows[0].id
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error saving simulation:', error)
      throw new Error(`Failed to save simulation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      client.release()
    }
  }

  /**
   * Load simulation by ID
   */
  static async loadSimulation(simulationId: string): Promise<SimulationResult | null> {
    try {
      const query = `
        SELECT * FROM genealogy_simulations 
        WHERE id = $1
      `
      
      const result = await pool.query(query, [simulationId])
      
      if (result.rows.length === 0) {
        return null
      }
      
      const row = result.rows[0]
      
      return {
        id: row.id,
        genealogy_type: row.genealogy_type,
        max_expected_users: row.max_expected_users,
        payout_cycle: row.payout_cycle,
        number_of_payout_cycles: row.number_of_payout_cycles,
        max_children_count: row.max_children_count,
        products: JSON.parse(row.products),
        users: JSON.parse(row.users),
        genealogy_structure: JSON.parse(row.genealogy_structure),
        simulation_summary: JSON.parse(row.simulation_summary),
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    } catch (error) {
      console.error('Error loading simulation:', error)
      throw new Error(`Failed to load simulation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update existing simulation
   */
  static async updateSimulation(simulation: SimulationResult): Promise<void> {
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      const updateQuery = `
        UPDATE genealogy_simulations SET
          genealogy_type = $2,
          max_expected_users = $3,
          payout_cycle = $4,
          number_of_payout_cycles = $5,
          max_children_count = $6,
          products = $7,
          users = $8,
          genealogy_structure = $9,
          simulation_summary = $10,
          updated_at = $11
        WHERE id = $1
      `
      
      await client.query(updateQuery, [
        simulation.id,
        simulation.genealogy_type,
        simulation.max_expected_users,
        simulation.payout_cycle,
        simulation.number_of_payout_cycles,
        simulation.max_children_count,
        JSON.stringify(simulation.products),
        JSON.stringify(simulation.users),
        JSON.stringify(simulation.genealogy_structure),
        JSON.stringify(simulation.simulation_summary),
        new Date()
      ])
      
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error updating simulation:', error)
      throw new Error(`Failed to update simulation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      client.release()
    }
  }

  /**
   * Delete simulation by ID
   */
  static async deleteSimulation(simulationId: string): Promise<void> {
    try {
      const query = `
        DELETE FROM genealogy_simulations 
        WHERE id = $1
      `
      
      await pool.query(query, [simulationId])
    } catch (error) {
      console.error('Error deleting simulation:', error)
      throw new Error(`Failed to delete simulation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get all simulations
   */
  static async getAllSimulations(): Promise<StoredSimulation[]> {
    try {
      const query = `
        SELECT * FROM genealogy_simulations 
        ORDER BY created_at DESC
      `
      
      const result = await pool.query(query)
      
      return result.rows.map(row => ({
        ...row,
        products: JSON.parse(row.products),
        users: JSON.parse(row.users),
        genealogy_structure: JSON.parse(row.genealogy_structure),
        simulation_summary: JSON.parse(row.simulation_summary)
      }))
    } catch (error) {
      console.error('Error getting simulations:', error)
      throw new Error(`Failed to get simulations: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get simulations by genealogy type
   */
  static async getSimulationsByType(genealogyType: string): Promise<StoredSimulation[]> {
    try {
      const query = `
        SELECT * FROM genealogy_simulations 
        WHERE genealogy_type = $1
        ORDER BY created_at DESC
      `
      
      const result = await pool.query(query, [genealogyType])
      
      return result.rows.map(row => ({
        ...row,
        products: JSON.parse(row.products),
        users: JSON.parse(row.users),
        genealogy_structure: JSON.parse(row.genealogy_structure),
        simulation_summary: JSON.parse(row.simulation_summary)
      }))
    } catch (error) {
      console.error('Error getting simulations by type:', error)
      throw new Error(`Failed to get simulations by type: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Search simulations by criteria
   */
  static async searchSimulations(criteria: {
    genealogy_type?: string
    min_users?: number
    max_users?: number
    date_from?: Date
    date_to?: Date
  }): Promise<StoredSimulation[]> {
    try {
      let query = 'SELECT * FROM genealogy_simulations WHERE 1=1'
      const params: any[] = []
      let paramCount = 1
      
      if (criteria.genealogy_type) {
        query += ` AND genealogy_type = $${paramCount}`
        params.push(criteria.genealogy_type)
        paramCount++
      }
      
      if (criteria.min_users) {
        query += ` AND max_expected_users >= $${paramCount}`
        params.push(criteria.min_users)
        paramCount++
      }
      
      if (criteria.max_users) {
        query += ` AND max_expected_users <= $${paramCount}`
        params.push(criteria.max_users)
        paramCount++
      }
      
      if (criteria.date_from) {
        query += ` AND created_at >= $${paramCount}`
        params.push(criteria.date_from)
        paramCount++
      }
      
      if (criteria.date_to) {
        query += ` AND created_at <= $${paramCount}`
        params.push(criteria.date_to)
        paramCount++
      }
      
      query += ' ORDER BY created_at DESC'
      
      const result = await pool.query(query, params)
      
      return result.rows.map(row => ({
        ...row,
        products: JSON.parse(row.products),
        users: JSON.parse(row.users),
        genealogy_structure: JSON.parse(row.genealogy_structure),
        simulation_summary: JSON.parse(row.simulation_summary)
      }))
    } catch (error) {
      console.error('Error searching simulations:', error)
      throw new Error(`Failed to search simulations: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get simulation statistics
   */
  static async getSimulationStats(): Promise<{
    total_simulations: number
    simulations_by_type: Record<string, number>
    average_users_per_simulation: number
    total_users_generated: number
  }> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_simulations,
          genealogy_type,
          AVG(max_expected_users) as avg_users,
          SUM(max_expected_users) as total_users
        FROM genealogy_simulations 
        GROUP BY genealogy_type
      `
      
      const result = await pool.query(query)
      
      const stats = {
        total_simulations: 0,
        simulations_by_type: {} as Record<string, number>,
        average_users_per_simulation: 0,
        total_users_generated: 0
      }
      
      for (const row of result.rows) {
        stats.total_simulations += parseInt(row.total_simulations)
        stats.simulations_by_type[row.genealogy_type] = parseInt(row.total_simulations)
        stats.average_users_per_simulation += parseFloat(row.avg_users) || 0
        stats.total_users_generated += parseInt(row.total_users) || 0
      }
      
      if (stats.total_simulations > 0) {
        stats.average_users_per_simulation = stats.average_users_per_simulation / stats.total_simulations
      }
      
      return stats
    } catch (error) {
      console.error('Error getting simulation stats:', error)
      throw new Error(`Failed to get simulation stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
