import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from './db'

export interface User {
  id: number
  email: string
  name: string
  role: 'system_admin' | 'admin' | 'user'
  whatsapp_number?: string
  organization_name?: string
  country?: string
  created_at: Date
  updated_at: Date
}

// For internal DB queries only
interface UserWithPasswordHash extends User {
  password_hash: string
}

export interface UserCreate {
  email: string
  name: string
  password: string
  role: 'system_admin' | 'admin' | 'user'
  whatsapp_number: string
  organization_name?: string
  country?: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  )
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
  } catch (error) {
    return null
  }
}

export async function createUser(userData: UserCreate): Promise<User> {
  const hashedPassword = await hashPassword(userData.password)
  
  const query = `
    INSERT INTO users (email, name, password_hash, role, whatsapp_number, organization_name, country, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING id, email, name, role, whatsapp_number, organization_name, country, created_at, updated_at
  `
  
  const values = [
    userData.email, 
    userData.name, 
    hashedPassword, 
    userData.role,
    userData.whatsapp_number,
    userData.organization_name || null,
    userData.country || null
  ]
  
  const result = await pool.query(query, values)
  
  return result.rows[0]
}

export async function getUserByEmail(email: string): Promise<UserWithPasswordHash | null> {
  const query = `
    SELECT id, email, name, password_hash, role, whatsapp_number, organization_name, country, created_at, updated_at
    FROM users WHERE email = $1
  `
  
  const result = await pool.query(query, [email])
  return result.rows[0] || null
}

export async function getUserById(id: number): Promise<User | null> {
  const query = `
    SELECT id, email, name, role, whatsapp_number, organization_name, country, created_at, updated_at
    FROM users WHERE id = $1
  `
  
  const result = await pool.query(query, [id])
  return result.rows[0] || null
}

export async function getUserByWhatsAppNumber(whatsappNumber: string): Promise<UserWithPasswordHash | null> {
  const query = `
    SELECT id, email, name, password_hash, role, whatsapp_number, organization_name, country, created_at, updated_at
    FROM users WHERE whatsapp_number = $1
  `
  
  const result = await pool.query(query, [whatsappNumber])
  return result.rows[0] || null
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email)
  if (!user) return null
  
  const isValid = await verifyPassword(password, user.password_hash)
  if (!isValid) return null
  
  // Remove password_hash from the returned user object
  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword as User
} 