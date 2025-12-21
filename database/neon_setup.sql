-- Neon Database Setup Script
-- Clean setup for Neon.tech free tier
-- Run this once to set up the complete database

-- Drop existing tables if any (clean slate)
DROP TABLE IF EXISTS business_products CASCADE;
DROP TABLE IF EXISTS business_plan_simulations CASCADE;
DROP TABLE IF EXISTS business_plan_templates CASCADE;
DROP TABLE IF EXISTS genealogy_nodes CASCADE;
DROP TABLE IF EXISTS genealogy_simulations CASCADE;
DROP TABLE IF EXISTS genealogy_types CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================
-- USERS TABLE
-- =====================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'system_admin', 'business_user')),
    whatsapp_number VARCHAR(20) UNIQUE,
    organization_name VARCHAR(255),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN users.role IS 'User role: user, admin, system_admin, business_user';

-- =====================
-- GENEALOGY TYPES TABLE
-- =====================
CREATE TABLE genealogy_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    max_children_per_node INTEGER DEFAULT 2,
    rules JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- GENEALOGY SIMULATIONS TABLE
-- =====================
CREATE TABLE genealogy_simulations (
    id SERIAL PRIMARY KEY,
    genealogy_type_id INTEGER REFERENCES genealogy_types(id),
    simulation_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- GENEALOGY NODES TABLE
-- =====================
CREATE TABLE genealogy_nodes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    genealogy_type_id INTEGER REFERENCES genealogy_types(id),
    parent_id INTEGER REFERENCES genealogy_nodes(id),
    left_bound INTEGER,
    right_bound INTEGER,
    level INTEGER DEFAULT 0,
    cycle INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, genealogy_type_id),
    UNIQUE(left_bound, right_bound, genealogy_type_id)
);

-- =====================
-- BUSINESS PLAN TEMPLATES TABLE
-- =====================
CREATE TABLE business_plan_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    genealogy_type_id INTEGER REFERENCES genealogy_types(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- BUSINESS PLAN SIMULATIONS TABLE
-- =====================
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

-- =====================
-- BUSINESS PRODUCTS TABLE
-- =====================
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

COMMENT ON COLUMN business_products.product_sales_ratio IS 'Product purchase rate (0-100%)';

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_whatsapp ON users(whatsapp_number);
CREATE INDEX idx_users_business_user ON users(id) WHERE role = 'business_user';
CREATE INDEX idx_users_organization ON users(organization_name);
CREATE INDEX idx_users_country ON users(country);

CREATE INDEX idx_genealogy_types_name ON genealogy_types(name);
CREATE INDEX idx_genealogy_types_active ON genealogy_types(is_active);

CREATE INDEX idx_genealogy_nodes_user ON genealogy_nodes(user_id);
CREATE INDEX idx_genealogy_nodes_type ON genealogy_nodes(genealogy_type_id);
CREATE INDEX idx_genealogy_nodes_parent ON genealogy_nodes(parent_id);
CREATE INDEX idx_genealogy_nodes_bounds ON genealogy_nodes(left_bound, right_bound);
CREATE INDEX idx_genealogy_nodes_cycle ON genealogy_nodes(cycle);

CREATE INDEX idx_business_plan_user ON business_plan_simulations(user_id);
CREATE INDEX idx_business_plan_created_by ON business_plan_simulations(created_by);
CREATE INDEX idx_business_plan_status ON business_plan_simulations(status);

CREATE INDEX idx_business_products_plan ON business_products(business_plan_id);
CREATE INDEX idx_business_products_type ON business_products(product_type);
CREATE INDEX idx_business_products_active ON business_products(is_active);

CREATE INDEX idx_business_templates_active ON business_plan_templates(is_active);

-- =====================
-- TRIGGERS
-- =====================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_genealogy_types_updated_at BEFORE UPDATE ON genealogy_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_genealogy_nodes_updated_at BEFORE UPDATE ON genealogy_nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_plan_templates_updated_at BEFORE UPDATE ON business_plan_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_plan_simulations_updated_at BEFORE UPDATE ON business_plan_simulations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_products_updated_at BEFORE UPDATE ON business_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- INSERT GENEALOGY TYPES
-- =====================
INSERT INTO genealogy_types (name, description, max_children_per_node, rules) VALUES
(
    'Binary Plan',
    'Binary tree structure where each node can have maximum 2 child nodes. Nodes are filled from top to bottom, left to right.',
    2,
    '{"type": "binary", "filling_order": "left_to_right", "spillover": true}'
),
(
    'Unilevel Plan',
    'Unlimited width structure where each node can have unlimited direct children. Simple sponsor-based tree.',
    999,
    '{"type": "unilevel", "unlimited_width": true, "level_compression": false}'
),
(
    'Matrix Plan',
    'Fixed-width matrix structure (e.g., 3x3, 5x7). Each node has a fixed maximum number of children.',
    5,
    '{"type": "matrix", "width": 5, "depth": 7, "forced_matrix": true}'
);

-- =====================
-- INSERT DEFAULT ADMIN USER
-- Password: Admin@123 (bcrypt hashed)
-- =====================
INSERT INTO users (name, email, password_hash, role, whatsapp_number, organization_name, country) VALUES
(
    'System Admin',
    'admin@epixel.com',
    '$2a$12$KfgCBbI54nCyScl3Anex0OCrYRVnQyCXJvVsg96SOBjuYbT25wbCS',
    'system_admin',
    '+1234567890',
    'Epixel MLM',
    'United States'
);

-- =====================
-- VERIFY SETUP
-- =====================
SELECT 'Setup complete!' AS status;
SELECT 'Tables created:' AS info, COUNT(*) AS count FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Genealogy types:' AS info, COUNT(*) AS count FROM genealogy_types;
SELECT 'Users:' AS info, COUNT(*) AS count FROM users;
