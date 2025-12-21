-- Track community post reports (for moderation + abuse prevention)

CREATE TABLE IF NOT EXISTS public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS post_reports_post_id_reporter_id_key
  ON public.post_reports (post_id, reporter_id);

CREATE INDEX IF NOT EXISTS idx_post_reports_post_id
  ON public.post_reports (post_id);

CREATE INDEX IF NOT EXISTS idx_post_reports_reporter_id
  ON public.post_reports (reporter_id);

CREATE POLICY "Authenticated users can report posts"
  ON public.post_reports
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = reporter_id);

CREATE POLICY "Admins and staff can view post reports"
  ON public.post_reports
  FOR SELECT
  TO authenticated
  USING (
    (SELECT is_admin((SELECT auth.uid())))
    OR (SELECT is_staff((SELECT auth.uid())))
  );

CREATE POLICY "Admins and staff can delete post reports"
  ON public.post_reports
  FOR DELETE
  TO authenticated
  USING (
    (SELECT is_admin((SELECT auth.uid())))
    OR (SELECT is_staff((SELECT auth.uid())))
  );
