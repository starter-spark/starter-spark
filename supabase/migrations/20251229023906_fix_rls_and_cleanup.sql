-- Fix RLS and cleanup issues found during admin audit
-- Migration created: 2025-12-29

-- =============================================================================
-- 1. FIX: profiles RLS policy uses 'published' but valid post statuses are:
--    open, solved, unanswered, flagged
-- =============================================================================

-- Drop the buggy policy
DROP POLICY IF EXISTS "Anon can view author profiles" ON profiles;

-- Recreate with correct status value (using 'open' instead of 'published')
-- Allow anon users to see profiles of post authors (open posts) and comment authors
CREATE POLICY "Anon can view author profiles" ON profiles
  FOR SELECT TO anon
  USING (
    id IN (SELECT DISTINCT author_id FROM posts WHERE status IN ('open', 'solved', 'unanswered'))
    OR id IN (SELECT DISTINCT author_id FROM comments)
  );

-- =============================================================================
-- 2. FIX: teapot_stats UPDATE policy allows anyone to update (qual = 'true')
--    This should be restricted to service_role only
-- =============================================================================

DROP POLICY IF EXISTS "Service role can update teapot stats" ON teapot_stats;

-- Only allow service_role to update teapot stats
CREATE POLICY "Service role can update teapot stats" ON teapot_stats
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 3. CLEANUP: Remove duplicate INSERT policies on several tables
--    These tables have both "Users can X" and "Authenticated users can X"
-- =============================================================================

-- comment_votes: Keep "Users can vote on comments" (has forum ban check), drop the other
DROP POLICY IF EXISTS "Authenticated users can vote on comments" ON comment_votes;

-- comments: Keep "Users can create comments" (has forum ban check), drop the other
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;

-- post_votes: Keep "Users can vote on posts" (has forum ban check), drop the other
DROP POLICY IF EXISTS "Authenticated users can vote on posts" ON post_votes;

-- posts: Keep "Users can create posts" (has forum ban check), drop the other
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;

-- post_reports: Keep "Users can report posts" (has forum ban check), drop the other
DROP POLICY IF EXISTS "Authenticated users can report posts" ON post_reports;

-- =============================================================================
-- 4. Add missing admin policies for posts table
--    Currently admins need to use supabaseAdmin to update/delete posts
-- =============================================================================

-- Allow admin/staff to update any post (for moderation)
CREATE POLICY "Admin can update posts" ON posts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Allow admin to delete any post (for moderation)
CREATE POLICY "Admin can delete posts" ON posts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================================================
-- 5. Add missing admin policies for comments table
--    Allow admins to delete inappropriate comments
-- =============================================================================

CREATE POLICY "Admin can delete comments" ON comments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
