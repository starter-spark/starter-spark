-- Lesson content moves into the CMS engine as the gated `lesson_content`
-- collection (key = lesson id): drafts, publish, history, and rollback for
-- the lesson editor. The lessons/modules/courses structure stays relational.
--
-- Gating: lesson content is paid material, so the anon-read policies gain a
-- type carve-out — gated types (registry: gated = true) never appear on the
-- public published path. Delivery goes through the app's license check with
-- the service role.
--
-- Seeds read the live lesson_content rows at apply time. Legacy rows are
-- markdown-first (content_blocks was never populated anywhere), so legacy
-- fields convert to blocks the same way the old editor seeded them: video →
-- video block, content → text block, code challenge starter → interactive
-- code block. Defensive path for non-empty block arrays: unknown block
-- types are skipped and the quiz answer key is normalized to correctAnswer
-- (the old editor wrote `correct`, which the renderer never read — the quiz
-- grading bug). Unpublished lessons migrate with their content unpublished.
-- Replay-safe throughout.

-- Gated-type carve-out on the anon read path
DROP POLICY IF EXISTS "Public can read published cms documents" ON public.cms_documents;
CREATE POLICY "Public can read published cms documents"
  ON public.cms_documents FOR SELECT
  USING (
    published_version_id IS NOT NULL
    AND deleted_at IS NULL
    AND type <> 'lesson_content'
  );

DROP POLICY IF EXISTS "Public can read published cms versions" ON public.cms_versions;
CREATE POLICY "Public can read published cms versions"
  ON public.cms_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cms_documents d
      WHERE d.published_version_id = cms_versions.id
        AND d.deleted_at IS NULL
        AND d.type <> 'lesson_content'
    )
  );

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
    VALUES (doc_id, 1, d, 'Migrated from lesson_content')
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
  blocks jsonb;
  elem jsonb;
  fixed jsonb;
BEGIN
  IF to_regclass('public.lesson_content') IS NULL THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT lc.lesson_id, lc.content, lc.content_blocks, lc.video_url,
           lc.code_starter, lc.code_solution,
           l.lesson_type,
           -- The learner page treats NULL is_published as published
           COALESCE(l.is_published, true) AS is_published,
           row_number() OVER (ORDER BY m.sort_order, l.sort_order, l.slug) AS rn
    FROM public.lesson_content lc
    JOIN public.lessons l ON l.id = lc.lesson_id
    JOIN public.modules m ON m.id = l.module_id
  LOOP
    blocks := '[]'::jsonb;

    IF jsonb_typeof(rec.content_blocks) = 'array'
       AND jsonb_array_length(rec.content_blocks) > 0 THEN
      FOR elem IN SELECT * FROM jsonb_array_elements(rec.content_blocks) LOOP
        IF elem->>'type' IS NULL OR elem->>'type' NOT IN (
          'text', 'heading', 'image', 'video', 'code', 'callout', 'download',
          'quiz', 'interactive_code', 'diagram', 'visual_blocks',
          'advanced_section', 'alternative_explanation'
        ) THEN
          -- An unknown type would fail schema validation and hide the
          -- whole document at read time
          CONTINUE;
        END IF;
        fixed := elem;
        IF COALESCE(fixed->>'id', '') = '' THEN
          fixed := jsonb_set(fixed, '{id}', to_jsonb(gen_random_uuid()::text));
        END IF;
        IF fixed->>'type' = 'quiz' THEN
          fixed := jsonb_set(fixed, '{correctAnswer}', COALESCE(
            fixed->'correctAnswer', fixed->'correct_answer', fixed->'correct',
            '0'::jsonb
          )) - 'correct' - 'correct_answer';
        END IF;
        IF fixed->>'type' = 'heading' THEN
          IF jsonb_typeof(fixed->'level') = 'number' THEN
            fixed := jsonb_set(fixed, '{level}',
              to_jsonb(LEAST(GREATEST((fixed->>'level')::numeric, 1), 3)::int));
          ELSE
            fixed := jsonb_set(fixed, '{level}', '1'::jsonb);
          END IF;
        END IF;
        blocks := blocks || jsonb_build_array(fixed);
      END LOOP;
    ELSE
      IF COALESCE(rec.video_url, '') <> '' THEN
        blocks := blocks || jsonb_build_array(jsonb_build_object(
          'id', gen_random_uuid()::text, 'type', 'video', 'url', rec.video_url));
      END IF;
      IF COALESCE(btrim(rec.content), '') <> '' THEN
        blocks := blocks || jsonb_build_array(jsonb_build_object(
          'id', gen_random_uuid()::text, 'type', 'text', 'content', rec.content));
      END IF;
      IF rec.lesson_type = 'code_challenge' AND COALESCE(rec.code_starter, '') <> '' THEN
        blocks := blocks || jsonb_build_array(jsonb_build_object(
          'id', gen_random_uuid()::text, 'type', 'interactive_code',
          'language', 'cpp',
          'starterCode', rec.code_starter,
          'solutionCode', COALESCE(rec.code_solution, '')));
      END IF;
    END IF;

    PERFORM pg_temp.seed_doc('lesson_content', rec.lesson_id::text, rec.rn,
      jsonb_build_object('blocks', blocks), rec.is_published);
  END LOOP;
END $$;

DROP TABLE IF EXISTS public.lesson_content;

DROP FUNCTION pg_temp.seed_doc(text, text, numeric, jsonb, boolean);
