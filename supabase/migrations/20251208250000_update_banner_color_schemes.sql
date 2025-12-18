-- Update site_banners color_scheme check constraint to include new promotional types
ALTER TABLE site_banners 
DROP CONSTRAINT IF EXISTS site_banners_color_scheme_check;
ALTER TABLE site_banners 
ADD CONSTRAINT site_banners_color_scheme_check 
CHECK (color_scheme IN ('info', 'warning', 'success', 'error', 'sale', 'promo', 'announcement', 'gift'));
