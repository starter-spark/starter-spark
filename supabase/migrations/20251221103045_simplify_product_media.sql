-- Simplify product media: remove image_type column
-- Images will be sorted by sort_order and is_primary flag
-- First image (by sort_order) becomes the hero image
-- Datasheets are detected by filename containing "datasheet"

-- Drop the image_type column
ALTER TABLE product_media DROP COLUMN IF EXISTS image_type;

-- Drop the enum type (only if no other columns use it)
DROP TYPE IF EXISTS product_image_type;
