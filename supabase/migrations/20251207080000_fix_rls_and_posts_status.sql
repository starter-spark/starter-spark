-- Fix duplicate RLS policies, performance issues, and posts status constraint

-- ============================================
-- 0. FIX POSTS STATUS CONSTRAINT - Add more statuses for moderation
-- ============================================

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;

ALTER TABLE posts ADD CONSTRAINT posts_status_check
  CHECK (status = ANY (ARRAY['open'::text, 'solved'::text, 'unanswered'::text, 'flagged'::text, 'approved'::text, 'rejected'::text, 'closed'::text]));

-- ============================================
-- 1. FIX POSTS TABLE - Remove duplicate policies
-- ============================================

DROP POLICY IF EXISTS "Authors can delete their posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can update their posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = author_id)
  WITH CHECK ((SELECT auth.uid()) = author_id);

-- ============================================
-- 2. FIX COMMENTS TABLE - Remove duplicate policies
-- ============================================

DROP POLICY IF EXISTS "Authors can delete their comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can update their comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = author_id)
  WITH CHECK ((SELECT auth.uid()) = author_id);

-- ============================================
-- 3. FIX LICENSES TABLE - Performance fix
-- ============================================

DROP POLICY IF EXISTS "Users can view own licenses" ON licenses;

CREATE POLICY "Users can view own licenses" ON licenses
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

-- ============================================
-- 4. FIX PROFILES TABLE - Performance fix
-- ============================================

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================
-- 5. FIX ADMIN_AUDIT_LOG TABLE - Performance fix
-- ============================================

DROP POLICY IF EXISTS "Admins can read audit logs" ON admin_audit_log;

CREATE POLICY "Admins can read audit logs" ON admin_audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'admin'::user_role
  ));

-- ============================================
-- 6. FIX SITE_STATS TABLE - Performance fix
-- ============================================

DROP POLICY IF EXISTS "Admins can manage site stats" ON site_stats;

CREATE POLICY "Admins can manage site stats" ON site_stats
  FOR ALL TO authenticated
  USING (is_admin((SELECT auth.uid())) OR is_staff((SELECT auth.uid())))
  WITH CHECK (is_admin((SELECT auth.uid())) OR is_staff((SELECT auth.uid())));
