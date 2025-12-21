-- Fix trigger functions missing search_path (security vulnerability)
-- These functions need search_path set to prevent SQL injection via schema manipulation

-- 1. set_primary_product_media
CREATE OR REPLACE FUNCTION public.set_primary_product_media()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE product_media
    SET is_primary = false
    WHERE product_id = NEW.product_id
      AND type = NEW.type
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. update_product_on_media_change
CREATE OR REPLACE FUNCTION public.update_product_on_media_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE products SET updated_at = now()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 3. update_products_updated_at
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 4. update_stripe_checkout_fulfillments_updated_at
CREATE OR REPLACE FUNCTION public.update_stripe_checkout_fulfillments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 5. update_site_banners_updated_at
CREATE OR REPLACE FUNCTION public.update_site_banners_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
