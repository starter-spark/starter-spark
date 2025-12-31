-- Add post bookmarks (saved posts)
-- Migration created: 2025-12-31

-- =============================================================================
-- 1) Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.post_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS post_bookmarks_post_id_user_id_key
  ON public.post_bookmarks (post_id, user_id);

CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user_created
  ON public.post_bookmarks (user_id, created_at DESC);

-- =============================================================================
-- 2) Policies (RLS)
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own post bookmarks" ON public.post_bookmarks;
CREATE POLICY "Users can view own post bookmarks"
  ON public.post_bookmarks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create post bookmarks" ON public.post_bookmarks;
CREATE POLICY "Users can create post bookmarks"
  ON public.post_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND NOT public.is_banned_from_forums(auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own post bookmarks" ON public.post_bookmarks;
CREATE POLICY "Users can delete own post bookmarks"
  ON public.post_bookmarks
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
