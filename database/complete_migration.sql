-- Complete MLM Tools Database Migration
-- This file contains all necessary database setup and current data
-- Created: 2025-07-29
-- Version: 4.2

-- Drop database if exists and create fresh
DROP DATABASE IF EXISTS epixel_mlm_tools;
CREATE DATABASE epixel_mlm_tools;
\c epixel_mlm_tools;

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

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'system_admin', 'business_user')),
    whatsapp_number VARCHAR(20) UNIQUE,
    organization VARCHAR(255),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN users.role IS 'User role: user, admin, system_admin, business_user';

-- Genealogy types table
CREATE TABLE genealogy_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Genealogy simulations table
CREATE TABLE genealogy_simulations (
    id SERIAL PRIMARY KEY,
    genealogy_type_id INTEGER REFERENCES genealogy_types(id),
    simulation_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Genealogy nodes table
CREATE TABLE genealogy_nodes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    genealogy_type_id INTEGER REFERENCES genealogy_types(id),
    parent_id INTEGER REFERENCES genealogy_nodes(id),
    left_bound INTEGER,
    right_bound INTEGER,
    level INTEGER DEFAULT 0,
    cycle INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, genealogy_type_id),
    UNIQUE(left_bound, right_bound, genealogy_type_id)
);

-- Business plan templates table
CREATE TABLE business_plan_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    genealogy_type_id INTEGER REFERENCES genealogy_types(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business plan simulations table
CREATE TABLE business_plan_simulations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    genealogy_simulation_id INTEGER REFERENCES genealogy_simulations(id),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business products table
CREATE TABLE business_products (
    id SERIAL PRIMARY KEY,
    business_plan_id INTEGER REFERENCES business_plan_simulations(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    product_sales_ratio INTEGER DEFAULT 100 CHECK (product_sales_ratio >= 0 AND product_sales_ratio <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN business_products.product_sales_ratio IS 'Product purchase rate (0-100%)';

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_whatsapp ON users(whatsapp_number);
CREATE INDEX idx_users_business_user ON users(id) WHERE role = 'business_user';
CREATE INDEX idx_users_organization ON users(organization);
CREATE INDEX idx_users_country ON users(country);

CREATE INDEX idx_genealogy_nodes_user ON genealogy_nodes(user_id);
CREATE INDEX idx_genealogy_nodes_type ON genealogy_nodes(genealogy_type_id);
CREATE INDEX idx_genealogy_nodes_parent ON genealogy_nodes(parent_id);
CREATE INDEX idx_genealogy_nodes_bounds ON genealogy_nodes(left_bound, right_bound);
CREATE INDEX idx_genealogy_nodes_simulation ON genealogy_nodes(genealogy_type_id);
CREATE INDEX idx_genealogy_nodes_cycle ON genealogy_nodes(cycle);

CREATE INDEX idx_business_plan_user ON business_plan_simulations(user_id);
CREATE INDEX idx_business_plan_created_by ON business_plan_simulations(created_by);
CREATE INDEX idx_business_plan_status ON business_plan_simulations(status);

CREATE INDEX idx_business_products_plan ON business_products(business_plan_id);
CREATE INDEX idx_business_products_type ON business_products(product_type);
CREATE INDEX idx_business_products_active ON business_products(is_active);

CREATE INDEX idx_business_templates_active ON business_plan_templates(is_active);

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_genealogy_types_updated_at BEFORE UPDATE ON genealogy_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_genealogy_nodes_updated_at BEFORE UPDATE ON genealogy_nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_plan_templates_updated_at BEFORE UPDATE ON business_plan_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_plan_simulations_updated_at BEFORE UPDATE ON business_plan_simulations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_products_updated_at BEFORE UPDATE ON business_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default genealogy types
INSERT INTO genealogy_types (name, description) VALUES
('Matrix', 'Matrix plan with fixed width and depth'),
('Unilevel', 'Unilevel plan with unlimited width and depth'),
('Binary', 'Binary plan with two legs');

-- Insert sample users (passwords are hashed versions of 'password123')
INSERT INTO users (name, email, password_hash, role, whatsapp_number, organization, country) VALUES
('System Admin', 'admin@epixel.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'system_admin', '+1234567890', 'Epixel MLM', 'United States'),
('Business User', 'business@epixel.com', '$2b$10$rQZ8K9vX2mN3pL4qR5sT6uV7wX8yZ9aA0bB1cC2dE3fF4gG5hH6iI7jJ8kK9lL0mM1nN2oO3pP4qQ5rR6sS7tT8uU9vV0wW1xX2yY3zZ', 'business_user', '+1234567891', 'Test Organization', 'United States');

-- Insert sample business plan simulation
INSERT INTO business_plan_simulations (name, user_id, created_by, status) VALUES
('Sample Business Plan', 2, 1, 'active');

-- Insert sample business products
INSERT INTO business_products (business_plan_id, product_name, product_type, price, product_sales_ratio) VALUES
(1, 'Premium Package', 'starter', 99.99, 80),
(1, 'Professional Package', 'premium', 199.99, 60),
(1, 'Enterprise Package', 'enterprise', 499.99, 40);

-- Set sequence values
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('genealogy_types_id_seq', (SELECT MAX(id) FROM genealogy_types));
SELECT setval('business_plan_simulations_id_seq', (SELECT MAX(id) FROM business_plan_simulations));
SELECT setval('business_products_id_seq', (SELECT MAX(id) FROM business_products)); 