-- Migration: Add business_user role
-- This migration adds the business_user role to the existing role constraint

-- First, drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with business_user role
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('system_admin', 'admin', 'user', 'business_user'));

-- Add index for business_user role queries
CREATE INDEX IF NOT EXISTS idx_users_business_user ON users(role) WHERE role = 'business_user';

-- Update any existing documentation or comments
COMMENT ON COLUMN users.role IS 'User role: system_admin, admin, user, or business_user'; 