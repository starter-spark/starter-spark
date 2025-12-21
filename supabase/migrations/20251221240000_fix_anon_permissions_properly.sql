-- Fix anon permissions properly
-- Previous migrations used REVOKE FROM PUBLIC but grants were made directly to anon
-- This migration revokes directly from anon

-- is_admin functions
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;

-- is_staff(uuid) overload
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
