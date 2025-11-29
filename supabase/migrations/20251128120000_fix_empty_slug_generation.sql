-- Fix slug generation to handle empty slugs by falling back to UUID prefix
CREATE OR REPLACE FUNCTION public.generate_post_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from title
  base_slug := LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug); -- Remove leading/trailing hyphens
  base_slug := SUBSTRING(base_slug FROM 1 FOR 50);

  -- If slug is empty (title was all special chars), use 'post-' prefix with first 8 chars of UUID
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'post-' || SUBSTRING(NEW.id::text FROM 1 FOR 8);
  END IF;

  new_slug := base_slug;

  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM posts WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := new_slug;
  RETURN NEW;
END;
$function$;
