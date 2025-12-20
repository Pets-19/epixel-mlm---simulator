-- Insert default system admin user with proper password hash
-- Password: admin123
-- This uses pgcrypto extension for bcrypt hashing

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Delete any existing admin user first
DELETE FROM users WHERE email = 'admin@epixelmlm.com';

-- Insert system admin with bcrypt hashed password for 'admin123'
INSERT INTO users (email, name, password_hash, role, whatsapp_number, organization_name, country, created_at, updated_at)
VALUES (
    'admin@epixelmlm.com',
    'System Administrator',
    crypt('admin123', gen_salt('bf', 12)),
    'system_admin',
    '+1234567890',
    'Epixel',
    'USA',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = crypt('admin123', gen_salt('bf', 12)),
    updated_at = NOW();

-- Insert a business user for testing
INSERT INTO users (email, name, password_hash, role, whatsapp_number, organization_name, country, created_at, updated_at)
VALUES (
    'business@epixel.com',
    'Business User',
    crypt('business123', gen_salt('bf', 12)),
    'business_user',
    '+1234567891',
    'Epixel Business',
    'USA',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = crypt('business123', gen_salt('bf', 12)),
    updated_at = NOW();
