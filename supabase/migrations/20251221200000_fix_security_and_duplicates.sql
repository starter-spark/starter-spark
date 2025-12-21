-- Fix security issues and remove duplicates found in audit
-- Issues addressed:
-- 1. Functions missing search_path (SQL injection risk)
-- 2. Backwards execute permissions (anon=true, authenticated=false)
-- 3. Duplicate RLS policies
-- 4. Duplicate triggers
-- 5. Redundant indexes

-------------------------------------------------
-- 1. Fix functions missing search_path
-------------------------------------------------

-- Fix increment_article_view - add search_path
CREATE OR REPLACE FUNCTION public.increment_article_view(article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE troubleshooting_articles
  SET view_count = view_count + 1
  WHERE id = article_id;
END;
$$;

-- Fix record_article_feedback - add search_path
CREATE OR REPLACE FUNCTION public.record_article_feedback(article_id uuid, is_helpful boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF is_helpful THEN
    UPDATE troubleshooting_articles
    SET helpful_count = helpful_count + 1
    WHERE id = article_id;
  ELSE
    UPDATE troubleshooting_articles
    SET not_helpful_count = not_helpful_count + 1
    WHERE id = article_id;
  END IF;
END;
$$;

-------------------------------------------------
-- 2. Fix backwards execute permissions
-------------------------------------------------

-- Revoke from anon, grant to authenticated for sensitive functions
REVOKE EXECUTE ON FUNCTION public.apply_learning_xp(uuid, integer, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.apply_learning_xp(uuid, integer, timestamptz) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.award_achievement(uuid, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.award_achievement(uuid, text, jsonb) TO authenticated;

-- These vote update functions should only be callable by authenticated users
REVOKE EXECUTE ON FUNCTION public.update_comment_upvotes(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_post_upvotes(uuid) FROM anon;

-- cleanup_expired_tags should only be service_role (admin cron job)
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_tags() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_tags() FROM authenticated;

-------------------------------------------------
-- 3. Remove duplicate RLS policies
-------------------------------------------------

-- licenses: Remove the simpler duplicate "Users can view own licenses"
-- Keep "Users can view their licenses" which has the full logic
DROP POLICY IF EXISTS "Users can view own licenses" ON public.licenses;

-- comments: Remove duplicate INSERT policy
-- Keep "Authenticated users can create comments" (more explicit check)
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.comments;

-------------------------------------------------
-- 4. Remove duplicate triggers on product_media
-------------------------------------------------

-- Drop all instances of the duplicate triggers first
DROP TRIGGER IF EXISTS trigger_set_primary_product_media ON public.product_media;
DROP TRIGGER IF EXISTS trigger_update_product_on_media_change ON public.product_media;

-- Recreate them once each with proper event specifications
CREATE TRIGGER trigger_set_primary_product_media
  AFTER INSERT OR UPDATE OF is_primary ON public.product_media
  FOR EACH ROW
  EXECUTE FUNCTION set_primary_product_media();

CREATE TRIGGER trigger_update_product_on_media_change
  AFTER INSERT OR UPDATE OR DELETE ON public.product_media
  FOR EACH ROW
  EXECUTE FUNCTION update_product_on_media_change();

-------------------------------------------------
-- 5. Remove redundant indexes
-- (unique indexes already provide the lookup benefit)
-------------------------------------------------

DROP INDEX IF EXISTS public.idx_achievements_key;
DROP INDEX IF EXISTS public.licenses_code_idx;
DROP INDEX IF EXISTS public.products_slug_idx;
DROP INDEX IF EXISTS public.idx_posts_slug;
DROP INDEX IF EXISTS public.idx_page_content_page_key;
DROP INDEX IF EXISTS public.idx_site_content_key;

-------------------------------------------------
-- 6. Add missing is_staff() without params for consistency
-------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'staff')
  );
$$;

-- Grant execute to authenticated only
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO service_role;
