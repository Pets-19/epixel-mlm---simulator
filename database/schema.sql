-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('system_admin', 'admin', 'user')),
    whatsapp_number VARCHAR(20) UNIQUE NOT NULL,
    organization_name VARCHAR(255),
    country VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on whatsapp_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp_number);

-- Create index on role for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create index on organization for organization-based queries
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_name);

-- Create index on country for country-based queries
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default system admin user (password will be hashed by the application)
-- This is just a placeholder - the actual user will be created via the API
INSERT INTO users (email, name, password_hash, role, whatsapp_number) 
VALUES ('admin@epixelmlm.com', 'System Administrator', 'placeholder', 'system_admin', '+1234567890')
ON CONFLICT (email) DO NOTHING;

-- Genealogy migration will be run separately 