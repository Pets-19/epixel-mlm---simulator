import { SimulationConfig, BusinessProduct } from '@/lib/business-plan'

export interface SimulationUser {
  id: string
  name: string
  email: string
  level: number
  parent_id?: string
  children: string[]
  genealogy_position: 'left' | 'right' | 'root'
  product_id?: number
  product_name?: string
  personal_volume: number
  team_volume: number
  commissionable_volume: number
  payout_cycle: number
  created_at: Date
}

export interface SimulationResult {
  id: string
  genealogy_type: string
  max_expected_users: number
  payout_cycle: string
  number_of_payout_cycles: number
  max_children_count: number
  products: BusinessProduct[]
  users: SimulationUser[]
  genealogy_structure: Record<string, string[]>
  simulation_summary: {
    total_users_generated: number
    users_per_cycle: Record<number, number>
    product_distribution: Record<string, { count: number, percentage: number }>
    total_personal_volume: number
    total_team_volume: number
    average_team_volume: number
  }
  created_at: Date
  updated_at: Date
}

export interface SimulationConfigExtended extends SimulationConfig {
  products: BusinessProduct[]
}

export class SimulationEngine {
  private config: SimulationConfigExtended
  private users: SimulationUser[] = []
  private genealogyStructure: Record<string, string[]> = {}
  private currentUserId = 1

  constructor(config: SimulationConfigExtended) {
    this.config = config
  }

  /**
   * Run the complete simulation
   */
  async runSimulation(): Promise<SimulationResult> {
    try {
      // Validate configuration
      this.validateConfiguration()

      // Generate genealogy structure
      await this.generateGenealogyStructure()

      // Assign products to users
      this.assignProductsToUsers()

      // Calculate volumes
      this.calculateVolumes()

      // Generate simulation result
      const result = this.generateSimulationResult()

      return result
    } catch (error) {
      console.error('Simulation error:', error)
      throw new Error(`Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate simulation configuration
   */
  private validateConfiguration(): void {
    const { genealogy_type, max_expected_users, max_children_count, products } = this.config

    // Validate genealogy type constraints
    if (genealogy_type === 'binary' && max_children_count !== 2) {
      throw new Error('Binary genealogy type requires exactly 2 children per user')
    }

    if (genealogy_type === 'unilevel' && max_children_count < 1) {
      throw new Error('Unilevel genealogy type requires at least 1 child per user')
    }

    if (genealogy_type === 'matrix' && max_children_count < 1) {
      throw new Error('Matrix genealogy type requires at least 1 child per user')
    }

    // Validate products
    if (!products || products.length === 0) {
      throw new Error('At least one product is required for simulation')
    }

    // Validate sales ratios total 100%
    const totalSalesRatio = products.reduce((sum, product) => sum + product.product_sales_ratio, 0)
    if (Math.abs(totalSalesRatio - 100) > 0.01) {
      throw new Error(`Product sales ratios must total 100%. Current total: ${totalSalesRatio}%`)
    }

    // Validate max users
    if (max_expected_users < 1) {
      throw new Error('Maximum expected users must be at least 1')
    }
  }

  /**
   * Generate genealogy structure gradually per payout cycle
   */
  private async generateGenealogyStructure(): Promise<void> {
    const { max_expected_users, number_of_payout_cycles, max_children_count, genealogy_type } = this.config
    
    // Calculate users per cycle
    const usersPerCycle = Math.ceil(max_expected_users / number_of_payout_cycles)
    
    // Create root user
    const rootUser: SimulationUser = {
      id: 'root_user',
      name: 'Root User',
      email: 'root@simulation.com',
      level: 0,
      parent_id: undefined,
      children: [],
      genealogy_position: 'root',
      personal_volume: 0,
      team_volume: 0,
      commissionable_volume: 0,
      payout_cycle: 0,
      created_at: new Date()
    }
    this.users.push(rootUser)
    this.genealogyStructure[rootUser.id] = []

    // Generate users for each payout cycle
    for (let cycle = 1; cycle <= number_of_payout_cycles; cycle++) {
      const cycleStartIndex = this.users.length
      const cycleEndIndex = Math.min(cycleStartIndex + usersPerCycle, max_expected_users)
      
      // Generate users for this cycle
      for (let i = cycleStartIndex; i < cycleEndIndex; i++) {
        const user = await this.generateUserForCycle(cycle, max_children_count, genealogy_type)
        this.users.push(user)
      }

      // Update genealogy structure for this cycle
      this.updateGenealogyStructureForCycle(cycle, max_children_count, genealogy_type)
    }
  }

  /**
   * Generate a single user for a specific cycle
   */
  private async generateUserForCycle(
    cycle: number, 
    maxChildren: number, 
    genealogyType: string
  ): Promise<SimulationUser> {
    const userId = `user_${this.currentUserId++}`
    const name = `User ${userId}`
    const email = `${userId}@simulation.com`
    
    // Find available parent position
    const parentInfo = this.findAvailableParentPosition(maxChildren, genealogyType)
    
    const user: SimulationUser = {
      id: userId,
      name,
      email,
      level: parentInfo.level + 1,
      parent_id: parentInfo.parentId,
      children: [],
      genealogy_position: parentInfo.position,
      personal_volume: 0,
      team_volume: 0,
      commissionable_volume: 0,
      payout_cycle: cycle,
      created_at: new Date()
    }

    // Update parent's children list
    if (parentInfo.parentId) {
      const parent = this.users.find(u => u.id === parentInfo.parentId)
      if (parent) {
        parent.children.push(userId)
      }
    }

    return user
  }

  /**
   * Find available parent position in genealogy
   */
  private findAvailableParentPosition(maxChildren: number, genealogyType: string): {
    parentId: string | undefined
    level: number
    position: 'left' | 'right' | 'root'
  } {
    // For root user
    if (this.users.length === 0) {
      return { parentId: undefined, level: 0, position: 'root' }
    }

    // Find parent with available slots
    for (const user of this.users) {
      if (user.children.length < maxChildren) {
        const position = user.children.length === 0 ? 'left' : 'right'
        return { parentId: user.id, level: user.level, position }
      }
    }

    // If no parent has slots, find the user with the lowest level
    const lowestLevelUser = this.users.reduce((lowest, current) => 
      current.level < lowest.level ? current : lowest
    )

    return { 
      parentId: lowestLevelUser.id, 
      level: lowestLevelUser.level, 
      position: lowestLevelUser.children.length === 0 ? 'left' : 'right'
    }
  }

  /**
   * Update genealogy structure for a specific cycle
   */
  private updateGenealogyStructureForCycle(
    cycle: number, 
    maxChildren: number, 
    genealogyType: string
  ): void {
    // Update genealogy structure based on genealogy type
    if (genealogyType === 'binary') {
      this.updateBinaryGenealogyStructure()
    } else if (genealogyType === 'unilevel') {
      this.updateUnilevelGenealogyStructure()
    } else if (genealogyType === 'matrix') {
      this.updateMatrixGenealogyStructure()
    }
  }

  /**
   * Update binary genealogy structure
   */
  private updateBinaryGenealogyStructure(): void {
    // Binary structure is already handled in user generation
    // Just ensure the structure is properly maintained
    for (const user of this.users) {
      if (user.children.length > 0) {
        this.genealogyStructure[user.id] = user.children
      }
    }
  }

  /**
   * Update unilevel genealogy structure
   */
  private updateUnilevelGenealogyStructure(): void {
    // For unilevel, all users are at the same level under the root
    const rootUser = this.users.find(u => u.level === 0)
    if (rootUser) {
      const level1Users = this.users.filter(u => u.level === 1)
      this.genealogyStructure[rootUser.id] = level1Users.map(u => u.id)
    }
  }

  /**
   * Update matrix genealogy structure
   */
  private updateMatrixGenealogyStructure(): void {
    // Matrix structure fills level by level
    const maxLevel = Math.max(...this.users.map(u => u.level))
    
    for (let level = 0; level < maxLevel; level++) {
      const levelUsers = this.users.filter(u => u.level === level)
      for (const user of levelUsers) {
        const nextLevelUsers = this.users.filter(u => u.level === level + 1 && u.parent_id === user.id)
        if (nextLevelUsers.length > 0) {
          this.genealogyStructure[user.id] = nextLevelUsers.map(u => u.id)
        }
      }
    }
  }

  /**
   * Assign products to users based on sales ratios
   */
  private assignProductsToUsers(): void {
    const { products } = this.config
    
    // Skip root user (no product assignment)
    const usersToAssign = this.users.filter(u => u.level > 0)
    
    for (const user of usersToAssign) {
      const assignedProduct = this.assignProductBasedOnSalesRatio(products)
      
      user.product_id = assignedProduct.id
      user.product_name = assignedProduct.product_name
      user.commissionable_volume = assignedProduct.business_volume
      user.personal_volume = assignedProduct.business_volume
    }
  }

  /**
   * Assign product based on sales ratio (random assignment)
   */
  private assignProductBasedOnSalesRatio(products: BusinessProduct[]): BusinessProduct {
    const random = Math.random() * 100
    let cumulativeRatio = 0
    
    for (const product of products) {
      cumulativeRatio += product.product_sales_ratio
      if (random <= cumulativeRatio) {
        return product
      }
    }
    
    // Fallback to last product
    return products[products.length - 1]
  }

  /**
   * Calculate personal and team volumes
   */
  private calculateVolumes(): void {
    // Personal volumes are already set during product assignment
    
    // Calculate team volumes (unlimited genealogy levels)
    for (const user of this.users) {
      user.team_volume = this.calculateTeamVolume(user.id)
    }
  }

  /**
   * Calculate team volume for a user (unlimited genealogy levels)
   */
  private calculateTeamVolume(userId: string): number {
    const user = this.users.find(u => u.id === userId)
    if (!user || user.children.length === 0) {
      return 0
    }

    let teamVolume = 0
    
    // Recursively calculate team volume
    for (const childId of user.children) {
      const child = this.users.find(u => u.id === childId)
      if (child) {
        teamVolume += child.personal_volume
        teamVolume += this.calculateTeamVolume(childId)
      }
    }
    
    return teamVolume
  }

  /**
   * Generate final simulation result
   */
  private generateSimulationResult(): SimulationResult {
    const { genealogy_type, max_expected_users, payout_cycle, number_of_payout_cycles, max_children_count, products } = this.config
    
    // Calculate simulation summary
    const usersPerCycle: Record<number, number> = {}
    const productDistribution: Record<string, { count: number, percentage: number }> = {}
    
    // Count users per cycle
    for (const user of this.users) {
      if (user.payout_cycle > 0) {
        usersPerCycle[user.payout_cycle] = (usersPerCycle[user.payout_cycle] || 0) + 1
      }
    }
    
    // Calculate product distribution
    const usersWithProducts = this.users.filter(u => u.product_id)
    for (const product of products) {
      const count = usersWithProducts.filter(u => u.product_id === product.id).length
      const percentage = usersWithProducts.length > 0 ? (count / usersWithProducts.length) * 100 : 0
      productDistribution[product.product_name] = { count, percentage }
    }
    
    // Calculate total volumes
    const totalPersonalVolume = this.users.reduce((sum, u) => sum + u.personal_volume, 0)
    const totalTeamVolume = this.users.reduce((sum, u) => sum + u.team_volume, 0)
    const averageTeamVolume = this.users.length > 0 ? totalTeamVolume / this.users.length : 0
    
    const simulationSummary = {
      total_users_generated: this.users.length,
      users_per_cycle: usersPerCycle,
      product_distribution: productDistribution,
      total_personal_volume: totalPersonalVolume,
      total_team_volume: totalTeamVolume,
      average_team_volume: averageTeamVolume
    }
    
    return {
      id: `sim_${Date.now()}`,
      genealogy_type,
      max_expected_users,
      payout_cycle,
      number_of_payout_cycles,
      max_children_count,
      products,
      users: this.users,
      genealogy_structure: this.genealogyStructure,
      simulation_summary: simulationSummary,
      created_at: new Date(),
      updated_at: new Date()
    }
  }

  /**
   * Get simulation progress (for real-time updates)
   */
  getSimulationProgress(): { current: number; total: number; percentage: number } {
    const total = this.config.max_expected_users
    const current = this.users.length
    const percentage = total > 0 ? (current / total) * 100 : 0
    
    return { current, total, percentage }
  }

  /**
   * Get intermediate results (for step-by-step display)
   */
  getIntermediateResults(): Partial<SimulationResult> {
    return {
      users: this.users,
      genealogy_structure: this.genealogyStructure,
      simulation_summary: {
        total_users_generated: this.users.length,
        users_per_cycle: {},
        product_distribution: {},
        total_personal_volume: 0,
        total_team_volume: 0,
        average_team_volume: 0
      }
    }
  }
}
