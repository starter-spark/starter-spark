-- Fix is_staff and is_admin function permissions (all overloads)
-- These are used in RLS policies so they need proper permissions

-- is_staff(user_id uuid) - fix with correct parameter name
REVOKE EXECUTE ON FUNCTION public.is_staff(user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff(user_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(user_id uuid) TO service_role;

-- is_admin() - parameterless version
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- is_admin(user_id uuid) - with parameter
REVOKE EXECUTE ON FUNCTION public.is_admin(user_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(user_id uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(user_id uuid) TO service_role;
