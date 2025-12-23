-- Account Management System Migration
-- Adds forum ban capability and profile picture seed for auto-generation

-- Add ban-related columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_banned_from_forums boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at timestamptz,
ADD COLUMN IF NOT EXISTS banned_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS ban_reason text,
ADD COLUMN IF NOT EXISTS avatar_seed text;

-- Create index for efficient ban lookups
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON profiles(is_banned_from_forums) WHERE is_banned_from_forums = true;

-- Create a security definer function to check if user is banned from forums
CREATE OR REPLACE FUNCTION is_banned_from_forums(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_banned_from_forums FROM profiles WHERE id = user_id),
    false
  );
$$;

-- Grant execute to authenticated users (needed for RLS policy checks)
GRANT EXECUTE ON FUNCTION is_banned_from_forums(uuid) TO authenticated;

-- Update RLS policy for posts to prevent banned users from creating
DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts" ON posts
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND NOT is_banned_from_forums(auth.uid())
);

-- Update RLS policy for comments to prevent banned users from creating
DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments" ON comments
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND NOT is_banned_from_forums(auth.uid())
);

-- Update RLS policy for post_votes to prevent banned users from voting on posts
DROP POLICY IF EXISTS "Users can vote on posts" ON post_votes;
CREATE POLICY "Users can vote on posts" ON post_votes
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT is_banned_from_forums(auth.uid())
);

-- Update RLS policy for comment_votes to prevent banned users from voting on comments
DROP POLICY IF EXISTS "Users can vote on comments" ON comment_votes;
CREATE POLICY "Users can vote on comments" ON comment_votes
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT is_banned_from_forums(auth.uid())
);

-- Update RLS policy for post_reports to prevent banned users from reporting
DROP POLICY IF EXISTS "Users can report posts" ON post_reports;
CREATE POLICY "Users can report posts" ON post_reports
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = reporter_id
  AND NOT is_banned_from_forums(auth.uid())
);

-- Add comment to document the new columns
COMMENT ON COLUMN profiles.is_banned_from_forums IS 'When true, user cannot create posts, comments, or vote in community forums';
COMMENT ON COLUMN profiles.banned_at IS 'Timestamp when the user was banned from forums';
COMMENT ON COLUMN profiles.banned_by IS 'User ID of the admin/staff who banned this user';
COMMENT ON COLUMN profiles.ban_reason IS 'Reason for the forum ban, visible to admins';
COMMENT ON COLUMN profiles.avatar_seed IS 'Seed for auto-generated avatar (defaults to user ID if null)';

-- Create function to ban a user from forums (for use in server actions)
CREATE OR REPLACE FUNCTION ban_user_from_forums(
  target_user_id uuid,
  reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get the calling user's ID
  admin_id := auth.uid();

  -- Verify the caller is admin or staff
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = admin_id
    AND role IN ('admin', 'staff')
  ) THEN
    RAISE EXCEPTION 'Only admins and staff can ban users';
  END IF;

  -- Prevent banning other admins/staff
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = target_user_id
    AND role IN ('admin', 'staff')
  ) THEN
    RAISE EXCEPTION 'Cannot ban admin or staff members';
  END IF;

  -- Apply the ban
  UPDATE profiles
  SET
    is_banned_from_forums = true,
    banned_at = now(),
    banned_by = admin_id,
    ban_reason = reason
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;

-- Create function to unban a user from forums
CREATE OR REPLACE FUNCTION unban_user_from_forums(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get the calling user's ID
  admin_id := auth.uid();

  -- Verify the caller is admin or staff
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = admin_id
    AND role IN ('admin', 'staff')
  ) THEN
    RAISE EXCEPTION 'Only admins and staff can unban users';
  END IF;

  -- Remove the ban
  UPDATE profiles
  SET
    is_banned_from_forums = false,
    banned_at = NULL,
    banned_by = NULL,
    ban_reason = NULL
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;

-- Only allow authenticated users to call ban/unban functions
REVOKE ALL ON FUNCTION ban_user_from_forums(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ban_user_from_forums(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION unban_user_from_forums(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION unban_user_from_forums(uuid) TO authenticated;

-- Update the profile update policy to allow users to update their own avatar_seed
-- (Existing policy should already cover this, but ensure avatar_seed is updatable)
