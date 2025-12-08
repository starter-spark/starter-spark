-- Fix: Allow multiple licenses per Stripe checkout session (for quantity > 1)
-- The unique constraint on stripe_session_id was causing batch inserts to fail
-- when a customer ordered more than 1 item

-- Drop the unique constraint on stripe_session_id
ALTER TABLE public.licenses DROP CONSTRAINT IF EXISTS licenses_stripe_session_id_key;

-- Drop the unique index if it exists separately
DROP INDEX IF EXISTS licenses_stripe_session_id_key;

-- Add a non-unique index for efficient lookups (idempotency checks)
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_session_id
  ON public.licenses (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
