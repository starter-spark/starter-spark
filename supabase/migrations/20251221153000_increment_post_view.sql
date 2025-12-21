-- Increment community post view_count from any session without broad UPDATE privileges.
-- Uses SECURITY DEFINER to bypass RLS while tightly scoping the update to a single row.

CREATE OR REPLACE FUNCTION public.increment_post_view(p_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_post_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_post_view(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_post_view(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_post_view(uuid) TO service_role;

