-- Fix RLS policy performance issues
-- Replace auth.uid() with (SELECT auth.uid()) and is_admin() with (SELECT is_admin())
-- This prevents re-evaluation of these functions for each row

-------------------------------------------------
-- achievements
-------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage achievements" ON public.achievements;
CREATE POLICY "Admins can manage achievements" ON public.achievements
  FOR ALL TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

-------------------------------------------------
-- contact_submissions
-------------------------------------------------
DROP POLICY IF EXISTS "Admin can delete submissions" ON public.contact_submissions;
CREATE POLICY "Admin can delete submissions" ON public.contact_submissions
  FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'::user_role
  ));

DROP POLICY IF EXISTS "Admin can update submissions" ON public.contact_submissions;
CREATE POLICY "Admin can update submissions" ON public.contact_submissions
  FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin can view all submissions" ON public.contact_submissions;
CREATE POLICY "Admin can view all submissions" ON public.contact_submissions
  FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

-------------------------------------------------
-- courses
-------------------------------------------------
DROP POLICY IF EXISTS "Admin can delete courses" ON public.courses;
CREATE POLICY "Admin can delete courses" ON public.courses
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin can insert courses" ON public.courses;
CREATE POLICY "Admin can insert courses" ON public.courses
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin can update courses" ON public.courses;
CREATE POLICY "Admin can update courses" ON public.courses
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin/staff can view all courses" ON public.courses;
CREATE POLICY "Admin/staff can view all courses" ON public.courses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

-------------------------------------------------
-- lesson_content
-------------------------------------------------
DROP POLICY IF EXISTS "Admin/staff can manage lesson content" ON public.lesson_content;
CREATE POLICY "Admin/staff can manage lesson content" ON public.lesson_content
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Owners can view published lesson content" ON public.lesson_content;
CREATE POLICY "Owners can view published lesson content" ON public.lesson_content
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    JOIN courses c ON c.id = m.course_id
    JOIN licenses lic ON lic.product_id = c.product_id
    WHERE l.id = lesson_content.lesson_id
      AND l.is_published = true
      AND m.is_published = true
      AND c.is_published = true
      AND lic.owner_id = (SELECT auth.uid())
  ));

-------------------------------------------------
-- lesson_progress
-------------------------------------------------
DROP POLICY IF EXISTS "Admin/staff can manage lesson progress" ON public.lesson_progress;
CREATE POLICY "Admin/staff can manage lesson progress" ON public.lesson_progress
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Users can insert progress for owned lessons" ON public.lesson_progress;
CREATE POLICY "Users can insert progress for owned lessons" ON public.lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
      JOIN courses c ON c.id = m.course_id
      JOIN licenses lic ON lic.product_id = c.product_id
      WHERE l.id = lesson_progress.lesson_id
        AND l.is_published = true
        AND m.is_published = true
        AND c.is_published = true
        AND lic.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view their own progress" ON public.lesson_progress;
CREATE POLICY "Users can view their own progress" ON public.lesson_progress
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-------------------------------------------------
-- lessons
-------------------------------------------------
DROP POLICY IF EXISTS "Admin can delete lessons" ON public.lessons;
CREATE POLICY "Admin can delete lessons" ON public.lessons
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin can insert lessons" ON public.lessons;
CREATE POLICY "Admin can insert lessons" ON public.lessons
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin can update lessons" ON public.lessons;
CREATE POLICY "Admin can update lessons" ON public.lessons
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin/staff can view all lessons" ON public.lessons;
CREATE POLICY "Admin/staff can view all lessons" ON public.lessons
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

-------------------------------------------------
-- licenses
-------------------------------------------------
DROP POLICY IF EXISTS "Users can claim or reject their pending licenses" ON public.licenses;
CREATE POLICY "Users can claim or reject their pending licenses" ON public.licenses
  FOR UPDATE TO authenticated
  USING (
    status = 'pending'::license_status
    AND customer_email = ((SELECT auth.jwt()) ->> 'email'::text)
  )
  WITH CHECK (
    ((status = 'claimed'::license_status) AND (owner_id = (SELECT auth.uid())))
    OR ((status = 'rejected'::license_status) AND (owner_id IS NULL))
  );

DROP POLICY IF EXISTS "Users can view their licenses" ON public.licenses;
CREATE POLICY "Users can view their licenses" ON public.licenses
  FOR SELECT TO authenticated
  USING (
    (owner_id = (SELECT auth.uid()))
    OR (
      (status = ANY (ARRAY['pending'::license_status, 'claimed_by_other'::license_status]))
      AND (customer_email = ((SELECT auth.jwt()) ->> 'email'::text))
    )
  );

-------------------------------------------------
-- modules
-------------------------------------------------
DROP POLICY IF EXISTS "Admin can delete modules" ON public.modules;
CREATE POLICY "Admin can delete modules" ON public.modules
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin can insert modules" ON public.modules;
CREATE POLICY "Admin can insert modules" ON public.modules
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin can update modules" ON public.modules;
CREATE POLICY "Admin can update modules" ON public.modules
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin/staff can view all modules" ON public.modules;
CREATE POLICY "Admin/staff can view all modules" ON public.modules
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

-------------------------------------------------
-- page_content
-------------------------------------------------
DROP POLICY IF EXISTS "Admin can manage page content" ON public.page_content;
CREATE POLICY "Admin can manage page content" ON public.page_content
  FOR ALL TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

-------------------------------------------------
-- product_media
-------------------------------------------------
DROP POLICY IF EXISTS "Admin delete product media" ON public.product_media;
CREATE POLICY "Admin delete product media" ON public.product_media
  FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin insert product media" ON public.product_media;
CREATE POLICY "Admin insert product media" ON public.product_media
  FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin update product media" ON public.product_media;
CREATE POLICY "Admin update product media" ON public.product_media
  FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

-------------------------------------------------
-- product_tags
-------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage product tags" ON public.product_tags;
CREATE POLICY "Admins can manage product tags" ON public.product_tags
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

-------------------------------------------------
-- site_banners
-------------------------------------------------
DROP POLICY IF EXISTS "Admin manage banners" ON public.site_banners;
CREATE POLICY "Admin manage banners" ON public.site_banners
  FOR ALL TO public
  USING ((SELECT is_admin()));

-------------------------------------------------
-- site_content
-------------------------------------------------
DROP POLICY IF EXISTS "Admin can manage site_content" ON public.site_content;
CREATE POLICY "Admin can manage site_content" ON public.site_content
  FOR ALL TO public
  USING ((SELECT is_admin()));

-------------------------------------------------
-- stripe_checkout_fulfillments
-------------------------------------------------
DROP POLICY IF EXISTS "Admin read stripe fulfillments" ON public.stripe_checkout_fulfillments;
CREATE POLICY "Admin read stripe fulfillments" ON public.stripe_checkout_fulfillments
  FOR SELECT TO public
  USING ((SELECT is_admin()));

-------------------------------------------------
-- team_members
-------------------------------------------------
DROP POLICY IF EXISTS "Admin can manage team members" ON public.team_members;
CREATE POLICY "Admin can manage team members" ON public.team_members
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

-------------------------------------------------
-- troubleshooting_articles
-------------------------------------------------
DROP POLICY IF EXISTS "Admin can delete articles" ON public.troubleshooting_articles;
CREATE POLICY "Admin can delete articles" ON public.troubleshooting_articles
  FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'::user_role
  ));

DROP POLICY IF EXISTS "Admin can insert articles" ON public.troubleshooting_articles;
CREATE POLICY "Admin can insert articles" ON public.troubleshooting_articles
  FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin can update articles" ON public.troubleshooting_articles;
CREATE POLICY "Admin can update articles" ON public.troubleshooting_articles
  FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Admin can view all articles" ON public.troubleshooting_articles;
CREATE POLICY "Admin can view all articles" ON public.troubleshooting_articles
  FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

-------------------------------------------------
-- user_achievements
-------------------------------------------------
DROP POLICY IF EXISTS "Admin/staff can view all user achievements" ON public.user_achievements;
CREATE POLICY "Admin/staff can view all user achievements" ON public.user_achievements
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = ANY (ARRAY['admin'::user_role, 'staff'::user_role])
  ));

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT TO public
  USING ((SELECT auth.uid()) = user_id);

-------------------------------------------------
-- user_learning_stats
-------------------------------------------------
DROP POLICY IF EXISTS "Users can view own learning stats" ON public.user_learning_stats;
CREATE POLICY "Users can view own learning stats" ON public.user_learning_stats
  FOR SELECT TO public
  USING ((SELECT auth.uid()) = user_id);
