-- Migration: Add commission_config field to business_plan_simulations table
-- This migration adds the commission_config JSONB field to store commission configurations

-- Add commission_config field to business_plan_simulations table
ALTER TABLE business_plan_simulations 
ADD COLUMN IF NOT EXISTS commission_config JSONB DEFAULT NULL;

-- Add index for commission_config queries
CREATE INDEX IF NOT EXISTS idx_business_plan_commission_config 
ON business_plan_simulations USING GIN (commission_config);

-- Add comment for documentation
COMMENT ON COLUMN business_plan_simulations.commission_config IS 'Stores commission configuration as JSON for the business plan';

-- Log the migration
INSERT INTO migrations_log (migration_name, executed_at) 
VALUES ('migration_add_commission_config.sql', NOW())
ON CONFLICT (migration_name) DO NOTHING;
