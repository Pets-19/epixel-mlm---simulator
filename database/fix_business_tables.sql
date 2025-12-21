-- Fix script for Neon database
-- Run this to fix the business_plan_simulations and business_products tables

-- Drop and recreate business_products first (due to foreign key)
DROP TABLE IF EXISTS business_products CASCADE;

-- Drop and recreate business_plan_simulations
DROP TABLE IF EXISTS business_plan_simulations CASCADE;

-- Recreate business_plan_simulations with correct schema
CREATE TABLE business_plan_simulations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    genealogy_simulation_id VARCHAR(100),
    business_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_by INTEGER REFERENCES users(id),
    commission_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recreate business_products with correct schema
CREATE TABLE business_products (
    id SERIAL PRIMARY KEY,
    business_plan_id INTEGER REFERENCES business_plan_simulations(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL CHECK (product_price > 0),
    business_volume DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (business_volume >= 0),
    product_sales_ratio DECIMAL(5,2) NOT NULL CHECK (product_sales_ratio >= 0 AND product_sales_ratio <= 100),
    product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('membership', 'retail', 'digital')),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_plan_user ON business_plan_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_business_plan_status ON business_plan_simulations(status);
CREATE INDEX IF NOT EXISTS idx_business_products_plan ON business_products(business_plan_id);

-- Create triggers
DROP TRIGGER IF EXISTS update_business_plan_simulations_updated_at ON business_plan_simulations;
CREATE TRIGGER update_business_plan_simulations_updated_at 
    BEFORE UPDATE ON business_plan_simulations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_products_updated_at ON business_products;
CREATE TRIGGER update_business_products_updated_at 
    BEFORE UPDATE ON business_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Business plan tables fixed successfully!' as status;
