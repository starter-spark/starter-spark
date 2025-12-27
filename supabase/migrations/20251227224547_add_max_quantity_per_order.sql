-- Add max_quantity_per_order column to products table
-- Allows admins to limit how many of a product a customer can purchase in a single order

ALTER TABLE products
ADD COLUMN IF NOT EXISTS max_quantity_per_order integer DEFAULT NULL;

-- Add constraint to ensure positive value if set
ALTER TABLE products
ADD CONSTRAINT products_max_quantity_per_order_positive
CHECK (max_quantity_per_order IS NULL OR max_quantity_per_order > 0);

COMMENT ON COLUMN products.max_quantity_per_order IS 'Maximum quantity a customer can purchase in a single order. NULL means no limit.';
