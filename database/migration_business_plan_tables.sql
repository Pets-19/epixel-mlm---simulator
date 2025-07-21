-- Migration: Create Business Plan and Product Tables
-- This migration creates the business plan simulation and product tables

-- Create business_plan_simulations table
CREATE TABLE IF NOT EXISTS business_plan_simulations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    genealogy_simulation_id VARCHAR(100) REFERENCES genealogy_simulations(id),
    business_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_products table
CREATE TABLE IF NOT EXISTS business_products (
    id SERIAL PRIMARY KEY,
    business_plan_id INTEGER REFERENCES business_plan_simulations(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL CHECK (product_price > 0),
    business_volume DECIMAL(10,2) NOT NULL CHECK (business_volume >= 0),
    product_sales_ratio DECIMAL(5,2) NOT NULL CHECK (product_sales_ratio >= 0 AND product_sales_ratio <= 100),
    product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('membership', 'retail', 'digital')),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_plan_templates table (for future use)
CREATE TABLE IF NOT EXISTS business_plan_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    genealogy_type_id INTEGER REFERENCES genealogy_types(id),
    default_config JSONB NOT NULL DEFAULT '{}',
    default_products JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_plan_user ON business_plan_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_business_plan_status ON business_plan_simulations(status);
CREATE INDEX IF NOT EXISTS idx_business_plan_created_by ON business_plan_simulations(created_by);
CREATE INDEX IF NOT EXISTS idx_business_products_plan ON business_products(business_plan_id);
CREATE INDEX IF NOT EXISTS idx_business_products_type ON business_products(product_type);
CREATE INDEX IF NOT EXISTS idx_business_products_active ON business_products(is_active);
CREATE INDEX IF NOT EXISTS idx_business_templates_active ON business_plan_templates(is_active);

-- Create triggers to update updated_at timestamp
CREATE TRIGGER update_business_plan_simulations_updated_at 
    BEFORE UPDATE ON business_plan_simulations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_products_updated_at 
    BEFORE UPDATE ON business_products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_plan_templates_updated_at 
    BEFORE UPDATE ON business_plan_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE business_plan_simulations IS 'Stores business plan simulations linked to users and genealogy simulations';
COMMENT ON TABLE business_products IS 'Stores products associated with business plan simulations';
COMMENT ON TABLE business_plan_templates IS 'Stores templates for business plan configurations (future use)'; 