-- Unified CMS engine: every editable content type lives in one versioned
-- document store. A document is (type, key) with two pointers into an
-- append-only version table; save-draft, publish, and rollback are pointer
-- moves, so drafts can never leak and history is never destroyed.
-- Replay-safe: every statement is idempotent.

CREATE TABLE IF NOT EXISTS public.cms_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  key text NOT NULL,
  sort_order numeric NOT NULL DEFAULT 0,
  published_version_id uuid,
  draft_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (type, key)
);

CREATE TABLE IF NOT EXISTS public.cms_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.cms_documents(id) ON DELETE CASCADE,
  version integer NOT NULL,
  data jsonb NOT NULL,
  note text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, version)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cms_documents_published_version_fkey'
  ) THEN
    ALTER TABLE public.cms_documents
      ADD CONSTRAINT cms_documents_published_version_fkey
        FOREIGN KEY (published_version_id) REFERENCES public.cms_versions(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cms_documents_draft_version_fkey'
  ) THEN
    ALTER TABLE public.cms_documents
      ADD CONSTRAINT cms_documents_draft_version_fkey
        FOREIGN KEY (draft_version_id) REFERENCES public.cms_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cms_versions_document ON public.cms_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_cms_documents_type_live ON public.cms_documents(type, sort_order)
  WHERE published_version_id IS NOT NULL AND deleted_at IS NULL;

ALTER TABLE public.cms_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_versions ENABLE ROW LEVEL SECURITY;

-- Public reads: published, non-deleted documents and exactly their published
-- version. Writes have NO policies at all — every mutation goes through
-- server actions using the service role (guarded by requireAdminOrStaff).
DROP POLICY IF EXISTS "Public can read published cms documents" ON public.cms_documents;
CREATE POLICY "Public can read published cms documents"
  ON public.cms_documents FOR SELECT
  USING (published_version_id IS NOT NULL AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Public can read published cms versions" ON public.cms_versions;
CREATE POLICY "Public can read published cms versions"
  ON public.cms_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_documents d
      WHERE d.published_version_id = cms_versions.id
        AND d.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Staff can read all cms documents" ON public.cms_documents;
CREATE POLICY "Staff can read all cms documents"
  ON public.cms_documents FOR SELECT TO authenticated
  USING ((SELECT is_staff((SELECT auth.uid()))));

DROP POLICY IF EXISTS "Staff can read all cms versions" ON public.cms_versions;
CREATE POLICY "Staff can read all cms versions"
  ON public.cms_versions FOR SELECT TO authenticated
  USING ((SELECT is_staff((SELECT auth.uid()))));

-- Convenience view for the public read path (RLS of the caller applies).
CREATE OR REPLACE VIEW public.cms_published
  WITH (security_invoker = true) AS
  SELECT d.type, d.key, d.sort_order, v.data,
         v.created_at AS published_at, d.updated_at
  FROM public.cms_documents d
  JOIN public.cms_versions v ON v.id = d.published_version_id
  WHERE d.deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Seeds (idempotent): commerce settings and impact stats migrated from
-- site_stats. site_stats itself is removed in a later phase once nothing
-- reads it.
DO $$
DECLARE
  doc_id uuid;
  ver_id uuid;
  rec record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cms_documents WHERE type = 'settings_commerce' AND key = 'default') THEN
    INSERT INTO public.cms_documents (type, key)
      VALUES ('settings_commerce', 'default')
      RETURNING id INTO doc_id;
    INSERT INTO public.cms_versions (document_id, version, data, note)
      VALUES (doc_id, 1,
        '{"freeShippingThresholdCents": 7500, "shippingRateCents": 999}'::jsonb,
        'Initial seed')
      RETURNING id INTO ver_id;
    UPDATE public.cms_documents SET published_version_id = ver_id WHERE id = doc_id;
  END IF;

  -- Guard on site_stats existing so this migration also replays cleanly
  -- after 20260729090000_remove_site_stats has dropped it.
  IF to_regclass('public.site_stats') IS NOT NULL THEN
    FOR rec IN SELECT * FROM public.site_stats LOOP
      IF NOT EXISTS (SELECT 1 FROM public.cms_documents WHERE type = 'impact_stat' AND key = rec.key) THEN
        INSERT INTO public.cms_documents (type, key, sort_order)
          VALUES ('impact_stat', rec.key, COALESCE(rec.sort_order, 0))
          RETURNING id INTO doc_id;
        INSERT INTO public.cms_versions (document_id, version, data, note)
          VALUES (doc_id, 1, jsonb_build_object(
            'label', rec.label,
            'value', rec.value::text,
            'suffix', COALESCE(rec.suffix, ''),
            'autoSource', COALESCE(rec.auto_source, 'none'),
            'visible', 'home' = ANY(rec.visible_on)
          ), 'Migrated from site_stats')
          RETURNING id INTO ver_id;
        UPDATE public.cms_documents SET published_version_id = ver_id WHERE id = doc_id;
      END IF;
    END LOOP;
  END IF;
END $$;
