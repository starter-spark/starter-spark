-- The docs system moves into the CMS engine: doc_categories becomes the
-- keyed `doc_category` collection, doc_pages the keyed `doc_page` collection
-- (key = URL slug, category = a doc_category key — the engine's first
-- cross-collection reference). doc_attachments survives as the engine's
-- attachment side table, re-keyed from doc_pages.id to cms_documents.id.
-- The search_docs function dies with the tables (search now scores the
-- cached collections in the app). Every consumer moved in the same change
-- that ships this migration.
--
-- Seeds read the live doc_* rows at apply time (each environment keeps its
-- own copy); unpublished rows migrate as drafts. Replay-safe throughout.

CREATE FUNCTION pg_temp.seed_doc(t text, k text, so numeric, d jsonb, publish boolean) RETURNS void AS $f$
DECLARE
  doc_id uuid;
  ver_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.cms_documents WHERE type = t AND key = k) THEN
    RETURN;
  END IF;
  INSERT INTO public.cms_documents (type, key, sort_order)
    VALUES (t, k, so)
    RETURNING id INTO doc_id;
  INSERT INTO public.cms_versions (document_id, version, data, note)
    VALUES (doc_id, 1, d, 'Migrated from docs tables')
    RETURNING id INTO ver_id;
  IF publish THEN
    UPDATE public.cms_documents SET published_version_id = ver_id WHERE id = doc_id;
  ELSE
    UPDATE public.cms_documents SET draft_version_id = ver_id WHERE id = doc_id;
  END IF;
END $f$ LANGUAGE plpgsql;

DO $$
DECLARE
  rec record;
BEGIN
  IF to_regclass('public.doc_categories') IS NOT NULL THEN
    FOR rec IN
      SELECT slug, name, description, icon, is_published,
             row_number() OVER (ORDER BY sort_order, slug) AS rn
      FROM public.doc_categories
      WHERE COALESCE(name, '') <> '' AND COALESCE(slug, '') <> ''
    LOOP
      -- Legacy columns were unbounded text; clamp to the registry limits or
      -- the seeded version fails schema validation and vanishes at read time.
      PERFORM pg_temp.seed_doc('doc_category', rec.slug, rec.rn, jsonb_build_object(
        'name', left(rec.name, 120),
        'description', left(COALESCE(rec.description, ''), 500),
        'icon', CASE
          WHEN rec.icon IN ('Rocket', 'Cpu', 'Zap', 'Wrench', 'Book', 'BookOpen')
            THEN rec.icon
          ELSE 'BookOpen'
        END
      ), COALESCE(rec.is_published, true));
    END LOOP;
  END IF;

  IF to_regclass('public.doc_pages') IS NOT NULL THEN
    -- doc_pages slugs were only unique per category, but the public lookup
    -- was always by slug alone; the engine makes that global uniqueness
    -- real, so a cross-category duplicate keeps its first (ordered) row.
    FOR rec IN
      SELECT p.slug, p.title, p.excerpt, p.content, p.is_published,
             c.slug AS category_slug,
             row_number() OVER (ORDER BY c.sort_order, p.sort_order, p.slug) AS rn
      FROM public.doc_pages p
      JOIN public.doc_categories c ON c.id = p.category_id
      WHERE COALESCE(p.title, '') <> '' AND COALESCE(p.slug, '') <> ''
    LOOP
      PERFORM pg_temp.seed_doc('doc_page', rec.slug, rec.rn, jsonb_build_object(
        'title', left(rec.title, 200),
        'category', rec.category_slug,
        'excerpt', left(COALESCE(rec.excerpt, ''), 500),
        'body', left(COALESCE(rec.content, ''), 100000)
      ), COALESCE(rec.is_published, false));
    END LOOP;
  END IF;
END $$;

-- The legacy policies join through page_id and block dropping it — retire
-- them before the re-key; their replacements are created below.
DROP POLICY IF EXISTS "Anyone can view attachments of published pages" ON public.doc_attachments;
DROP POLICY IF EXISTS "Admins can manage attachments" ON public.doc_attachments;
DROP POLICY IF EXISTS "Staff can view all attachments" ON public.doc_attachments;
DROP POLICY IF EXISTS "Public can read doc attachments" ON storage.objects;

-- Re-key doc_attachments from doc_pages.id to cms_documents.id. Rows whose
-- page never became a CMS document (deleted mid-flight) lose their target
-- and are dropped with their pages.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'doc_attachments'
      AND column_name = 'page_id'
  ) THEN
    ALTER TABLE public.doc_attachments
      ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES public.cms_documents(id) ON DELETE CASCADE;

    -- Only the page that actually seeded the document keeps its files: a
    -- cross-category duplicate slug loses its page above, and its
    -- attachments must drop with it rather than re-parent onto the winner.
    UPDATE public.doc_attachments a
    SET document_id = d.id
    FROM (
      SELECT DISTINCT ON (p.slug) p.id AS page_id, p.slug
      FROM public.doc_pages p
      JOIN public.doc_categories c ON c.id = p.category_id
      ORDER BY p.slug, c.sort_order, p.sort_order, p.id
    ) w
    JOIN public.cms_documents d ON d.type = 'doc_page' AND d.key = w.slug
    WHERE a.page_id = w.page_id AND a.document_id IS NULL;

    DELETE FROM public.doc_attachments WHERE document_id IS NULL;

    ALTER TABLE public.doc_attachments ALTER COLUMN document_id SET NOT NULL;
    ALTER TABLE public.doc_attachments DROP COLUMN page_id;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_doc_attachments_document
  ON public.doc_attachments(document_id);

-- Attachment reads mirror the cms tables: public sees attachments of
-- published, non-deleted documents; all writes go through server actions
-- with the service role, so no write policies exist.
DROP POLICY IF EXISTS "Public can read attachments of published documents" ON public.doc_attachments;
CREATE POLICY "Public can read attachments of published documents"
  ON public.doc_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_documents d
      WHERE d.id = doc_attachments.document_id
        AND d.published_version_id IS NOT NULL
        AND d.deleted_at IS NULL
    )
  );

-- The bucket policy follows the row policy: anonymous list()/metadata only
-- for attachments of published documents. (public = true still serves any
-- object at its public URL; paths embed a server-minted UUID.)
CREATE POLICY "Public can read doc attachments"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'doc-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.doc_attachments a
    JOIN public.cms_documents d ON d.id = a.document_id
    WHERE a.storage_path = storage.objects.name
      AND d.published_version_id IS NOT NULL
      AND d.deleted_at IS NULL
  )
);

DROP FUNCTION IF EXISTS public.search_docs(text, integer);
DROP TABLE IF EXISTS public.doc_pages;
DROP TABLE IF EXISTS public.doc_categories;

DROP FUNCTION pg_temp.seed_doc(text, text, numeric, jsonb, boolean);
