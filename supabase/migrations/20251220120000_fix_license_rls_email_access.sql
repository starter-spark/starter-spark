-- Fix RLS policies that incorrectly access auth.users directly
-- The auth.users table is not accessible to authenticated users
-- Use auth.jwt() ->> 'email' instead to get the current user's email

-- Drop the broken policies
DROP POLICY IF EXISTS "Users can view their licenses" ON licenses;
DROP POLICY IF EXISTS "Users can claim or reject their pending licenses" ON licenses;

-- Recreate the SELECT policy with correct email access
CREATE POLICY "Users can view their licenses"
ON licenses FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR (
    status IN ('pending', 'claimed_by_other')
    AND customer_email = (auth.jwt() ->> 'email')
  )
);

-- Recreate the UPDATE policy with correct email access
CREATE POLICY "Users can claim or reject their pending licenses"
ON licenses FOR UPDATE
TO authenticated
USING (
  status = 'pending'
  AND customer_email = (auth.jwt() ->> 'email')
)
WITH CHECK (
  status IN ('claimed', 'rejected')
);
