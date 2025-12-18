-- Migration: Add image_type to product_media
-- Phase 16.4: Image Consistency - allows tagging images with their purpose

-- Create enum for image types
CREATE TYPE product_image_type AS ENUM (
  'hero',        -- Main product image (assembled)
  'knolling',    -- All components laid flat
  'detail',      -- Close-up of electronics/components
  'action',      -- Product in use
  'packaging',   -- Box/unboxing shot
  'other'        -- Default/uncategorized
);
-- Add image_type column to product_media
ALTER TABLE product_media
ADD COLUMN image_type product_image_type DEFAULT 'other';
-- Create index for quick lookups by image type
CREATE INDEX idx_product_media_image_type
ON product_media(product_id, image_type);
-- Add comment for documentation
COMMENT ON COLUMN product_media.image_type IS
'Semantic type of image: hero (main), knolling (flat lay), detail (close-up), action (in use), packaging (box), other';
