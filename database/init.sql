-- Initialize the database with system admin user
-- This script should be run after the schema is created

-- Remove the placeholder user if it exists
DELETE FROM users WHERE email = 'admin@epixelmlm.com' AND password_hash = 'placeholder';

-- The actual system admin user will be created via the /api/auth/init endpoint
-- This ensures proper password hashing and validation 