-- Tighten license claim/reject update semantics (defense-in-depth)
-- The UPDATE policy previously claimed "only status/owner_id can change" but did not enforce it.
-- This migration:
-- 1) Strengthens the UPDATE policy's WITH CHECK to require correct owner_id semantics.
-- 2) Adds a trigger that blocks authenticated users from mutating immutable license fields.

-------------------------------------------------
-- 1) Strengthen UPDATE policy (pending -> claimed/rejected only)
-------------------------------------------------

DROP POLICY IF EXISTS "Users can claim or reject their pending licenses" ON public.licenses;

CREATE POLICY "Users can claim or reject their pending licenses"
ON public.licenses FOR UPDATE
TO authenticated
USING (
  status = 'pending'
  AND customer_email = (auth.jwt() ->> 'email')
)
WITH CHECK (
  (status = 'claimed' AND owner_id = auth.uid())
  OR (status = 'rejected' AND owner_id IS NULL)
);

-------------------------------------------------
-- 2) Enforce immutable license fields for authenticated
-------------------------------------------------

CREATE OR REPLACE FUNCTION public.restrict_authenticated_license_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := current_setting('request.jwt.claim.role', true);
BEGIN
  -- Only restrict normal authenticated clients. service_role/admin tooling should be able
  -- to perform administrative updates without being blocked by this trigger.
  IF v_role IS DISTINCT FROM 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- Only allow updates for pending licenses.
  IF OLD.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Only pending licenses can be updated' USING ERRCODE = '42501';
  END IF;

  -- Block tampering with immutable fields.
  IF NEW.code IS DISTINCT FROM OLD.code THEN
    RAISE EXCEPTION 'Cannot modify license code' USING ERRCODE = '42501';
  END IF;
  IF NEW.product_id IS DISTINCT FROM OLD.product_id THEN
    RAISE EXCEPTION 'Cannot modify license product' USING ERRCODE = '42501';
  END IF;
  IF NEW.customer_email IS DISTINCT FROM OLD.customer_email THEN
    RAISE EXCEPTION 'Cannot modify license customer_email' USING ERRCODE = '42501';
  END IF;
  IF NEW.source IS DISTINCT FROM OLD.source THEN
    RAISE EXCEPTION 'Cannot modify license source' USING ERRCODE = '42501';
  END IF;
  IF NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id THEN
    RAISE EXCEPTION 'Cannot modify license stripe_session_id' USING ERRCODE = '42501';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify license created_at' USING ERRCODE = '42501';
  END IF;

  -- Normalize allowed transitions.
  IF NEW.status = 'claimed' THEN
    NEW.owner_id := auth.uid();
    NEW.claim_token := NULL;
    NEW.claimed_at := COALESCE(NEW.claimed_at, now());
    RETURN NEW;
  ELSIF NEW.status = 'rejected' THEN
    NEW.owner_id := NULL;
    NEW.claimed_at := NULL;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Invalid license status transition' USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_authenticated_license_updates ON public.licenses;
CREATE TRIGGER trg_restrict_authenticated_license_updates
BEFORE UPDATE ON public.licenses
FOR EACH ROW
EXECUTE FUNCTION public.restrict_authenticated_license_updates();

