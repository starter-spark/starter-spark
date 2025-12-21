-- Stripe fulfillment idempotency + per-item license dedupe
--
-- Problems addressed:
-- - Stripe webhooks can be delivered more than once (or concurrently).
-- - A checkout session can create multiple licenses (quantity > 1).
-- - Stock decrement + emails must not run multiple times per session.
--
-- This migration adds:
-- 1) `licenses.purchase_item_ref` (unique when not null) to dedupe license creation
--    per Stripe line item + quantity index.
-- 2) `stripe_checkout_fulfillments` to track per-session processing state and make
--    the webhook handler idempotent for stock decrement + email delivery.

-------------------------------------------------
-- 1) Licenses: per-item purchase ref (optional)
-------------------------------------------------

ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS purchase_item_ref text;

CREATE UNIQUE INDEX IF NOT EXISTS licenses_purchase_item_ref_key
  ON public.licenses (purchase_item_ref)
  WHERE purchase_item_ref IS NOT NULL;

-------------------------------------------------
-- 2) Stripe checkout fulfillments
-------------------------------------------------

CREATE TABLE IF NOT EXISTS public.stripe_checkout_fulfillments (
  stripe_session_id text PRIMARY KEY,
  stripe_event_id text,
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'completed', 'failed')),
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text,
  stock_decremented_at timestamptz,
  email_sent_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_checkout_fulfillments_status
  ON public.stripe_checkout_fulfillments (status, updated_at DESC);

ALTER TABLE public.stripe_checkout_fulfillments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stripe_checkout_fulfillments'
      AND policyname = 'Admin read stripe fulfillments'
  ) THEN
    CREATE POLICY "Admin read stripe fulfillments"
      ON public.stripe_checkout_fulfillments
      FOR SELECT
      USING (is_admin());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stripe_checkout_fulfillments TO service_role;

CREATE OR REPLACE FUNCTION public.update_stripe_checkout_fulfillments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stripe_checkout_fulfillments_updated_at ON public.stripe_checkout_fulfillments;
CREATE TRIGGER stripe_checkout_fulfillments_updated_at
  BEFORE UPDATE ON public.stripe_checkout_fulfillments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stripe_checkout_fulfillments_updated_at();

-------------------------------------------------
-- 3) Tighten authenticated license immutability
--    (extend prior trigger to cover purchase_item_ref)
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
  IF NEW.purchase_item_ref IS DISTINCT FROM OLD.purchase_item_ref THEN
    RAISE EXCEPTION 'Cannot modify license purchase_item_ref' USING ERRCODE = '42501';
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

