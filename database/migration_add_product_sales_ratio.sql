-- Migration: Add product_sales_ratio column to business_products table
-- This migration adds the product_sales_ratio column to existing business_products table

-- Add the product_sales_ratio column with a default value
ALTER TABLE business_products 
ADD COLUMN IF NOT EXISTS product_sales_ratio DECIMAL(5,2) DEFAULT 0.00;

-- Add check constraint for the new column
ALTER TABLE business_products 
ADD CONSTRAINT business_products_sales_ratio_check 
CHECK (product_sales_ratio >= 0 AND product_sales_ratio <= 100);

-- Update existing records to have a default sales ratio if they don't have one
UPDATE business_products 
SET product_sales_ratio = 0.00 
WHERE product_sales_ratio IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE business_products 
ALTER COLUMN product_sales_ratio SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN business_products.product_sales_ratio IS 'Product purchase rate as a percentage (0-100)'; 