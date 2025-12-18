-- Add image_type to product_media
-- Phase 16.4: Image Consistency - allows tagging images with their purpose

-- Create enum for image types
DO $$ BEGIN
  CREATE TYPE product_image_type AS ENUM (
    'hero',
    'knolling',
    'detail',
    'action',
    'packaging',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add image_type column to product_media
ALTER TABLE product_media
ADD COLUMN IF NOT EXISTS image_type product_image_type DEFAULT 'other';

-- Create index for quick lookups by image type
CREATE INDEX IF NOT EXISTS idx_product_media_image_type
ON product_media(product_id, image_type);

-- Add comment for documentation
COMMENT ON COLUMN product_media.image_type IS
'Semantic type of image: hero (main), knolling (flat lay), detail (close-up), action (in use), packaging (box), other';;
