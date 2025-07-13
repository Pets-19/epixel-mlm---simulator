-- Migration: Add unique constraint on whatsapp_number
-- This migration should be run on existing databases

-- First, ensure all existing whatsapp_number values are unique
-- If there are duplicates, we need to handle them before adding the constraint
-- For now, we'll add the constraint and let it fail if there are duplicates

-- Add unique constraint on whatsapp_number
ALTER TABLE users ADD CONSTRAINT users_whatsapp_number_unique UNIQUE (whatsapp_number);

-- Add index on whatsapp_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp_number);

-- Update the system admin user to have a proper whatsapp number if it doesn't have one
UPDATE users 
SET whatsapp_number = '+1234567890' 
WHERE email = 'admin@epixelmlm.com' AND (whatsapp_number IS NULL OR whatsapp_number = ''); 