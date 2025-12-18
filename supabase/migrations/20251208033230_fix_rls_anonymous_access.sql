-- Fix RLS policies that incorrectly allow anonymous access
-- These policies should require authenticated role for mutations

-- 1. admin_audit_log - Only authenticated admins should read
DROP POLICY IF EXISTS "Admins can read audit logs" ON admin_audit_log;
CREATE POLICY "Admins can read audit logs" ON admin_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- 2. comment_votes - mutations need authenticated
DROP POLICY IF EXISTS "Users can remove their comment votes" ON comment_votes;
DROP POLICY IF EXISTS "Users can update their comment votes" ON comment_votes;

CREATE POLICY "Users can remove their comment votes" ON comment_votes
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their comment votes" ON comment_votes
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 3. comments - mutations need authenticated  
DROP POLICY IF EXISTS "Authors can delete their comments" ON comments;
DROP POLICY IF EXISTS "Authors can update their comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Staff can mark verified answers" ON comments;

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = author_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = author_id);

CREATE POLICY "Staff can mark verified answers" ON comments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- 4. events - admin manage needs authenticated
DROP POLICY IF EXISTS "Admins can manage events" ON events;
CREATE POLICY "Admins can manage events" ON events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- 5. lesson_progress - all ops need authenticated
DROP POLICY IF EXISTS "Users can update their own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can view their own progress" ON lesson_progress;

CREATE POLICY "Users can view their own progress" ON lesson_progress
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own progress" ON lesson_progress
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 6. licenses - all ops need authenticated
DROP POLICY IF EXISTS "Admins can view all licenses" ON licenses;
DROP POLICY IF EXISTS "Users can view own licenses" ON licenses;

CREATE POLICY "Admins can view all licenses" ON licenses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Users can view own licenses" ON licenses
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

-- 7. post_votes - mutations need authenticated
DROP POLICY IF EXISTS "Users can remove their own votes" ON post_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON post_votes;

CREATE POLICY "Users can remove their own votes" ON post_votes
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own votes" ON post_votes
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 8. posts - mutations need authenticated
DROP POLICY IF EXISTS "Authors can delete their posts" ON posts;
DROP POLICY IF EXISTS "Authors can update their posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = author_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = author_id);

-- 9. products - admin ops need authenticated
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- 10. profiles - update needs authenticated
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id);

-- 11. site_stats - admin manage needs authenticated
DROP POLICY IF EXISTS "Admins can manage site stats" ON site_stats;
CREATE POLICY "Admins can manage site stats" ON site_stats
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role IN ('admin', 'staff')
    )
  );;
