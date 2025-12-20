#!/bin/bash

# Script to add commission_config column to existing database
echo "Adding commission_config column to business_plan_simulations table..."

docker exec -i epixel_mlm_postgres psql -U postgres -d epixel_mlm_tools <<'EOF'
-- Add commission_config field to business_plan_simulations table
ALTER TABLE business_plan_simulations 
ADD COLUMN IF NOT EXISTS commission_config JSONB DEFAULT NULL;

-- Add index for commission_config queries
CREATE INDEX IF NOT EXISTS idx_business_plan_commission_config 
ON business_plan_simulations USING GIN (commission_config);

-- Add comment for documentation
COMMENT ON COLUMN business_plan_simulations.commission_config IS 'Stores commission configuration as JSON for the business plan';

-- Verify the column was added
\d business_plan_simulations
EOF

echo "Done! commission_config column has been added."
