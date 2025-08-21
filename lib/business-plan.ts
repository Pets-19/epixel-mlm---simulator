import pool from './db'

export interface BusinessProduct {
  id?: number
  business_plan_id?: number
  product_name: string
  product_price: number
  business_volume: number
  product_sales_ratio: number
  product_type: 'membership' | 'retail' | 'digital'
  sort_order?: number
  is_active?: boolean
  created_at?: Date
  updated_at?: Date
}

export interface BusinessPlanSimulation {
  id?: number
  user_id: number
  genealogy_simulation_id?: string
  business_name: string
  status?: 'draft' | 'active' | 'completed' | 'cancelled'
  created_by?: number
  created_at?: Date
  updated_at?: Date
  products?: BusinessProduct[]
  commission_config?: any
  user?: {
    id: number
    name: string
    email: string
    role: string
  }
}

export interface BusinessPlanCreate {
  user_id: number
  business_name: string
  products: BusinessProduct[]
  genealogy_simulation_id?: string
  commission_config?: any // Will be stored as JSON in database
}

export interface BusinessPlanUpdate {
  business_name?: string
  status?: 'draft' | 'active' | 'completed' | 'cancelled'
  products?: BusinessProduct[]
  commission_config?: any
}

export interface BusinessPlanTemplate {
  id?: number
  name: string
  description?: string
  genealogy_type_id: number
  default_config: Record<string, any>
  default_products: BusinessProduct[]
  is_active?: boolean
  created_at?: Date
  updated_at?: Date
}

// Database functions
export async function createBusinessPlan(data: BusinessPlanCreate): Promise<BusinessPlanSimulation> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    // Create business plan
    const planQuery = `
      INSERT INTO business_plan_simulations (user_id, name, genealogy_simulation_id, created_by, commission_config)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, name, status, created_at, updated_at
    `
    
    const planResult = await client.query(planQuery, [
      data.user_id,
      data.business_name,
      data.genealogy_simulation_id || null,
      data.user_id, // created_by defaults to user_id for now
      data.commission_config ? JSON.stringify(data.commission_config) : null
    ])
    
    const businessPlan = planResult.rows[0]
    
          // Create products
      if (data.products && data.products.length > 0) {
        const productQuery = `
          INSERT INTO business_products (business_plan_id, product_name, product_price, business_volume, product_sales_ratio, product_type, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, product_name, product_price, business_volume, product_sales_ratio, product_type, sort_order, is_active, created_at, updated_at
        `
        
        for (let i = 0; i < data.products.length; i++) {
          const product = data.products[i]
          await client.query(productQuery, [
            businessPlan.id,
            product.product_name,
            product.product_price,
            product.business_volume,
            product.product_sales_ratio,
            product.product_type,
            i + 1
          ])
        }
      }
    
    await client.query('COMMIT')
    
    // Return the created business plan with products
    const result = await getBusinessPlanById(businessPlan.id)
    if (!result) {
      throw new Error('Failed to retrieve created business plan')
    }
    return result
    
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getBusinessPlanById(id: number): Promise<BusinessPlanSimulation | null> {
  const planQuery = `
    SELECT bp.*, u.name as user_name, u.email as user_email, u.role as user_role
    FROM business_plan_simulations bp
    JOIN users u ON bp.user_id = u.id
    WHERE bp.id = $1
  `
  
  const planResult = await pool.query(planQuery, [id])
  
  if (planResult.rows.length === 0) {
    return null
  }
  
  const businessPlan = planResult.rows[0]
  
  // Get products
  const productsQuery = `
    SELECT id, product_name, product_price, business_volume, product_sales_ratio, product_type, sort_order, is_active, created_at, updated_at
    FROM business_products
    WHERE business_plan_id = $1 AND is_active = true
    ORDER BY sort_order
  `
  
  const productsResult = await pool.query(productsQuery, [id])
  
  return {
    ...businessPlan,
    business_name: businessPlan.name, // Map database field to interface field
    products: productsResult.rows,
    commission_config: businessPlan.commission_config ? JSON.parse(businessPlan.commission_config) : null,
    user: {
      id: businessPlan.user_id,
      name: businessPlan.user_name,
      email: businessPlan.user_email,
      role: businessPlan.user_role
    }
  }
}

export async function getBusinessPlansByUserId(userId: number): Promise<BusinessPlanSimulation[]> {
  const query = `
    SELECT bp.*, u.name as user_name, u.email as user_email, u.role as user_role
    FROM business_plan_simulations bp
    JOIN users u ON bp.user_id = u.id
    WHERE bp.user_id = $1
    ORDER BY bp.created_at DESC
  `
  
  const result = await pool.query(query, [userId])
  
  const businessPlans = result.rows.map(row => ({
    ...row,
    business_name: row.name, // Map database field to interface field
    commission_config: row.commission_config ? JSON.parse(row.commission_config) : null,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      role: row.user_role
    }
  }))
  
  // Get products for each business plan
  for (const plan of businessPlans) {
    const productsQuery = `
      SELECT id, product_name, product_price, business_volume, product_sales_ratio, product_type, sort_order, is_active, created_at, updated_at
      FROM business_products
      WHERE business_plan_id = $1 AND is_active = true
      ORDER BY sort_order
    `
    
    const productsResult = await pool.query(productsQuery, [plan.id])
    plan.products = productsResult.rows
  }
  
  return businessPlans
}

export async function getAllBusinessPlans(): Promise<BusinessPlanSimulation[]> {
  const query = `
    SELECT bp.*, u.name as user_name, u.email as user_email, u.role as user_role
    FROM business_plan_simulations bp
    JOIN users u ON bp.user_id = u.id
    ORDER BY bp.created_at DESC
  `
  
  const result = await pool.query(query)
  
  const businessPlans = result.rows.map(row => ({
    ...row,
    business_name: row.name, // Map database field to interface field
    commission_config: row.commission_config ? JSON.parse(row.commission_config) : null,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      role: row.user_role
    }
  }))
  
  // Get products for each business plan
  for (const plan of businessPlans) {
    const productsQuery = `
      SELECT id, product_name, product_price, business_volume, product_sales_ratio, product_type, sort_order, is_active, created_at, updated_at
      FROM business_products
      WHERE business_plan_id = $1 AND is_active = true
      ORDER BY sort_order
    `
    
    const productsResult = await pool.query(productsQuery, [plan.id])
    plan.products = productsResult.rows
  }
  
  return businessPlans
}

export async function updateBusinessPlan(id: number, data: BusinessPlanUpdate): Promise<BusinessPlanSimulation | null> {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    // Update business plan
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramCount = 1
    
    if (data.business_name !== undefined) {
      updateFields.push(`name = $${paramCount}`)
      updateValues.push(data.business_name)
      paramCount++
    }
    
    if (data.status !== undefined) {
      updateFields.push(`status = $${paramCount}`)
      updateValues.push(data.status)
      paramCount++
    }
    
    if (data.commission_config !== undefined) {
      updateFields.push(`commission_config = $${paramCount}`)
      updateValues.push(JSON.stringify(data.commission_config))
      paramCount++
    }
    
    if (updateFields.length > 0) {
      updateValues.push(id)
      const updateQuery = `
        UPDATE business_plan_simulations 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING id
      `
      
      const updateResult = await client.query(updateQuery, updateValues)
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return null
      }
    }
    
    // Update products if provided
    if (data.products) {
      // First, deactivate all existing products
      await client.query(
        'UPDATE business_products SET is_active = false WHERE business_plan_id = $1',
        [id]
      )
      
      // Then, insert new products
      const productQuery = `
        INSERT INTO business_products (business_plan_id, product_name, product_price, business_volume, product_sales_ratio, product_type, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `
      
      for (let i = 0; i < data.products.length; i++) {
        const product = data.products[i]
        await client.query(productQuery, [
          id,
          product.product_name,
          product.product_price,
          product.business_volume,
          product.product_sales_ratio,
          product.product_type,
          i + 1
        ])
      }
    }
    
    await client.query('COMMIT')
    
    const result = await getBusinessPlanById(id)
    if (!result) {
      throw new Error('Failed to retrieve updated business plan')
    }
    return result
    
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function deleteBusinessPlan(id: number): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM business_plan_simulations WHERE id = $1',
    [id]
  )
  
  return (result.rowCount || 0) > 0
}

export async function getBusinessUsers(): Promise<{ id: number; name: string; email: string; role: string }[]> {
  const query = `
    SELECT id, name, email, role
    FROM users
    WHERE role = 'business_user'
    ORDER BY name
  `
  
  const result = await pool.query(query)
  return result.rows
} 