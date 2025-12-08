-- Phase 14.4: Inventory Tracking & Automated Tags
-- Adds inventory management columns to products and creates triggers for automated stock tags

-- Add inventory columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT null;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory boolean DEFAULT false;

-- Add constraint to ensure stock_quantity is non-negative when set
ALTER TABLE products ADD CONSTRAINT products_stock_quantity_check
  CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

-- Create function to auto-update stock-related tags
CREATE OR REPLACE FUNCTION update_stock_tags()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process if inventory tracking is enabled
  IF NEW.track_inventory THEN
    -- Handle out_of_stock tag
    IF NEW.stock_quantity IS NOT NULL AND NEW.stock_quantity <= 0 THEN
      -- Add out_of_stock tag if not exists
      INSERT INTO product_tags (product_id, tag, priority)
      VALUES (NEW.id, 'out_of_stock', 100)
      ON CONFLICT (product_id, tag) DO NOTHING;
    ELSE
      -- Remove out_of_stock tag if exists
      DELETE FROM product_tags
      WHERE product_id = NEW.id AND tag = 'out_of_stock';
    END IF;

    -- Handle limited (low stock) tag
    IF NEW.stock_quantity IS NOT NULL
       AND NEW.stock_quantity > 0
       AND NEW.stock_quantity <= COALESCE(NEW.low_stock_threshold, 10) THEN
      -- Add limited tag if not exists
      INSERT INTO product_tags (product_id, tag, priority)
      VALUES (NEW.id, 'limited', 90)
      ON CONFLICT (product_id, tag) DO NOTHING;
    ELSE
      -- Remove limited tag if exists
      DELETE FROM product_tags
      WHERE product_id = NEW.id AND tag = 'limited';
    END IF;
  ELSE
    -- If inventory tracking disabled, remove automated stock tags
    DELETE FROM product_tags
    WHERE product_id = NEW.id AND tag IN ('out_of_stock', 'limited');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock tag updates
DROP TRIGGER IF EXISTS trigger_update_stock_tags ON products;
CREATE TRIGGER trigger_update_stock_tags
  AFTER INSERT OR UPDATE OF stock_quantity, low_stock_threshold, track_inventory
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_tags();

-- Create function to handle "new" product tag (auto-added for products created in last 30 days)
CREATE OR REPLACE FUNCTION update_new_product_tag()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add "new" tag to newly created products
  INSERT INTO product_tags (product_id, tag, priority)
  VALUES (NEW.id, 'new', 50)
  ON CONFLICT (product_id, tag) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new product tag on INSERT
DROP TRIGGER IF EXISTS trigger_new_product_tag ON products;
CREATE TRIGGER trigger_new_product_tag
  AFTER INSERT
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_new_product_tag();

-- Create index for inventory queries
CREATE INDEX IF NOT EXISTS idx_products_inventory
  ON products(track_inventory, stock_quantity)
  WHERE track_inventory = true;

-- Comment on columns for documentation
COMMENT ON COLUMN products.stock_quantity IS 'Current stock quantity. NULL means unlimited/not tracked.';
COMMENT ON COLUMN products.low_stock_threshold IS 'Threshold below which product is marked as "limited" stock.';
COMMENT ON COLUMN products.track_inventory IS 'Whether to track inventory for this product.';
