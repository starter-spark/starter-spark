-- Migration: Security and Performance Fixes
-- Date: 2025-12-07
-- Description: Fix RLS WITH CHECK, add SET search_path to functions, add FK indexes, remove duplicate index

-- ============================================
-- 1. ADD SET search_path TO FUNCTIONS (FIRST!)
-- ============================================

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;
-- Fix is_staff function (ensure it also has search_path)
CREATE OR REPLACE FUNCTION public.is_staff(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('admin', 'staff')
  );
$$;
-- Fix get_site_stats function
CREATE OR REPLACE FUNCTION public.get_site_stats()
RETURNS TABLE(key text, value integer, label text, suffix text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ss.key,
    ss.value,
    ss.label,
    ss.suffix
  FROM public.site_stats ss
  WHERE ss.is_public = true
  ORDER BY ss.display_order;
END;
$$;
-- Fix get_course_progress function (preserve existing signature, just add search_path)
CREATE OR REPLACE FUNCTION public.get_course_progress(p_course_id uuid, p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_lessons
  FROM public.lessons l
  JOIN public.modules m ON l.module_id = m.id
  WHERE m.course_id = p_course_id;

  IF total_lessons = 0 THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO completed_lessons
  FROM public.lesson_progress lp
  JOIN public.lessons l ON lp.lesson_id = l.id
  JOIN public.modules m ON l.module_id = m.id
  WHERE m.course_id = p_course_id
  AND lp.user_id = p_user_id;

  RETURN ROUND((completed_lessons::NUMERIC / total_lessons::NUMERIC) * 100);
END;
$$;
-- Fix generate_post_slug function
CREATE OR REPLACE FUNCTION public.generate_post_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Only generate slug if title is provided and not empty
  IF NEW.title IS NOT NULL AND NEW.title != '' THEN
    -- Generate base slug from title
    base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);

    -- Ensure slug is not empty after processing
    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'post';
    END IF;

    final_slug := base_slug;

    -- Check for uniqueness and append counter if needed
    WHILE EXISTS (SELECT 1 FROM public.posts WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := final_slug;
  ELSIF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- If no title and no slug, generate a random slug
    NEW.slug := 'post-' || substr(md5(random()::text), 1, 8);
  END IF;

  RETURN NEW;
END;
$$;
-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), profiles.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$$;
-- Fix user_owns_product function (preserve existing signature)
CREATE OR REPLACE FUNCTION public.user_owns_product(p_product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.licenses
    WHERE owner_id = (SELECT auth.uid())
    AND product_id = p_product_id
  );
END;
$$;
-- Fix update_events_updated_at function
CREATE OR REPLACE FUNCTION public.update_events_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
-- Fix update_post_status_on_verified_answer function
CREATE OR REPLACE FUNCTION public.update_post_status_on_verified_answer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_verified_answer = true AND OLD.is_verified_answer = false THEN
    UPDATE public.posts
    SET status = 'resolved'
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$;
-- Fix update_site_stats_updated_at function
CREATE OR REPLACE FUNCTION public.update_site_stats_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
-- ============================================
-- 2. FIX site_stats RLS POLICY WITH CHECK
-- ============================================

-- Drop existing policy and recreate with proper WITH CHECK
DROP POLICY IF EXISTS "Admins can manage site stats" ON public.site_stats;
CREATE POLICY "Admins can manage site stats"
ON public.site_stats
FOR ALL
TO authenticated
USING (is_admin(auth.uid()) OR is_staff(auth.uid()))
WITH CHECK (is_admin(auth.uid()) OR is_staff(auth.uid()));
-- ============================================
-- 3. ADD INDEXES FOR UNINDEXED FOREIGN KEYS
-- ============================================

-- Index for comment_votes.user_id
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON public.comment_votes(user_id);
-- Index for comments.author_id
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
-- Index for licenses.product_id
CREATE INDEX IF NOT EXISTS idx_licenses_product_id ON public.licenses(product_id);
-- Index for post_votes.user_id
CREATE INDEX IF NOT EXISTS idx_post_votes_user_id ON public.post_votes(user_id);
-- Index for posts.author_id
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
-- ============================================
-- 4. REMOVE DUPLICATE INDEX ON POSTS TABLE
-- ============================================

-- Drop the duplicate index (keeping posts_created_at_idx as the canonical one)
DROP INDEX IF EXISTS public.idx_posts_created_at;
