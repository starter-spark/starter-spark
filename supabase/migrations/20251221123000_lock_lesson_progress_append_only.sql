-- Phase 21 Security (follow-up): make lesson_progress append-only for learners
-- 1) Remove authenticated UPDATE policy (learners shouldn't edit completed_at)
-- 2) Allow admin/staff to manage progress (support/debug)
-- 3) Defense-in-depth triggers:
--    - Normalize INSERT (force user_id + completed_at for non-admin/staff authenticated)
--    - Block UPDATE/DELETE for non-admin/staff authenticated

-------------------------------------------------
-- 1) Policies
-------------------------------------------------

DROP POLICY IF EXISTS "Users can update progress for owned lessons" ON public.lesson_progress;

-- Admin/staff can manage progress (keeps support tools possible without service_role).
DROP POLICY IF EXISTS "Admin/staff can manage lesson progress" ON public.lesson_progress;
CREATE POLICY "Admin/staff can manage lesson progress"
  ON public.lesson_progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff')
    )
  );

-------------------------------------------------
-- 2) Privileges (defense-in-depth)
-------------------------------------------------

-- Progress is never needed for anonymous clients.
REVOKE ALL ON TABLE public.lesson_progress FROM anon;
REVOKE ALL ON TABLE public.lesson_progress FROM PUBLIC;

-- Authenticated clients can read/insert; UPDATE/DELETE are still blocked by RLS + triggers
-- unless the caller is admin/staff.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lesson_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lesson_progress TO service_role;

-------------------------------------------------
-- 3) Triggers (defense-in-depth)
-------------------------------------------------

CREATE OR REPLACE FUNCTION public.normalize_lesson_progress_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := current_setting('request.jwt.claim.role', true);
  v_user_role public.user_role;
BEGIN
  -- Only normalize for normal authenticated clients (not service_role/admin tooling).
  IF v_role IS DISTINCT FROM 'authenticated' THEN
    RETURN NEW;
  END IF;

  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- Allow staff/admin to backfill/adjust timestamps if needed.
  IF v_user_role IN ('admin', 'staff') THEN
    RETURN NEW;
  END IF;

  -- Learner inserts are always "now" and always for themselves.
  NEW.user_id := auth.uid();
  NEW.completed_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.normalize_lesson_progress_insert() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_normalize_lesson_progress_insert ON public.lesson_progress;
CREATE TRIGGER trg_normalize_lesson_progress_insert
BEFORE INSERT ON public.lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.normalize_lesson_progress_insert();

CREATE OR REPLACE FUNCTION public.restrict_lesson_progress_mutations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := current_setting('request.jwt.claim.role', true);
  v_user_role public.user_role;
BEGIN
  -- Only restrict normal authenticated clients (not service_role/admin tooling).
  IF v_role IS DISTINCT FROM 'authenticated' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_user_role IN ('admin', 'staff') THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Lesson progress is append-only' USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION public.restrict_lesson_progress_mutations() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_restrict_lesson_progress_updates ON public.lesson_progress;
CREATE TRIGGER trg_restrict_lesson_progress_updates
BEFORE UPDATE ON public.lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.restrict_lesson_progress_mutations();

DROP TRIGGER IF EXISTS trg_restrict_lesson_progress_deletes ON public.lesson_progress;
CREATE TRIGGER trg_restrict_lesson_progress_deletes
BEFORE DELETE ON public.lesson_progress
FOR EACH ROW
EXECUTE FUNCTION public.restrict_lesson_progress_mutations();

