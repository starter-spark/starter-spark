-- Fix function permissions that weren't properly revoked
-- The previous migration revoked from anon/authenticated but not from PUBLIC
-- which is the default grant target

-- Revoke from PUBLIC first, then grant to appropriate roles

-- Vote update functions: authenticated + service_role only
REVOKE EXECUTE ON FUNCTION public.update_post_upvotes(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_post_upvotes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_post_upvotes(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_comment_upvotes(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_comment_upvotes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_comment_upvotes(uuid) TO service_role;

-- cleanup_expired_tags: service_role only (cron job)
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_tags() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_tags() TO service_role;

-- is_staff(): authenticated + service_role only
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO service_role;
