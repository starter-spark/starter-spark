-- Ensure admin-only policies do not evaluate is_admin() for anonymous roles.

-- site_banners
DROP POLICY IF EXISTS "Admin manage banners" ON public.site_banners;
CREATE POLICY "Admin manage banners" ON public.site_banners
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

-- site_content
DROP POLICY IF EXISTS "Admin can manage site_content" ON public.site_content;
CREATE POLICY "Admin can manage site_content" ON public.site_content
  FOR ALL TO authenticated
  USING ((SELECT is_admin()))
  WITH CHECK ((SELECT is_admin()));

-- stripe_checkout_fulfillments
DROP POLICY IF EXISTS "Admin read stripe fulfillments" ON public.stripe_checkout_fulfillments;
CREATE POLICY "Admin read stripe fulfillments" ON public.stripe_checkout_fulfillments
  FOR SELECT TO authenticated
  USING ((SELECT is_admin()));
