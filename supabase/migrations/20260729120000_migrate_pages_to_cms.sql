-- page_content moves into the CMS engine. Legal and custom pages become
-- entries in the keyed `page` collection (key = URL slug; privacy and terms
-- render at their own routes, everything else under /p/{slug}); the About
-- page's hero + story copy becomes the `about_page` singleton. Every
-- consumer moved in the same change that ships this migration.
--
-- Seeds read the live page_content rows at apply time (each environment
-- keeps its own copy). Page bodies are legal text and cannot be invented, so
-- a missing table seeds no page entries; about_page falls back to registry
-- defaults. Replay-safe throughout.

CREATE FUNCTION pg_temp.seed_doc(t text, k text, d jsonb, publish boolean) RETURNS void AS $f$
DECLARE
  doc_id uuid;
  ver_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.cms_documents WHERE type = t AND key = k) THEN
    RETURN;
  END IF;
  INSERT INTO public.cms_documents (type, key, sort_order)
    VALUES (t, k, 0)
    RETURNING id INTO doc_id;
  INSERT INTO public.cms_versions (document_id, version, data, note)
    VALUES (doc_id, 1, d, 'Migrated from page_content')
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
  hero_headline text := 'Robotics education shouldn''t have a $200 entry fee.';
  hero_description text := 'We''re a student-run team based in Honolulu making hardware kits you actually build yourself, no experience required, no high markups. If you can follow a wiring diagram, you can start here.';
  story text := E'## How it started\n\nOur first robotics experience was in 5th grade. It was fine, nothing life-changing, and we moved on. Fast-forward to high school: FRC teams with expensive drivetrains, tight-knit communities, REV Robotics kits, CNC-milled aluminum. We loved it. But we kept picturing our ten-year-old selves back then — wiring LEGO motors to plastic bricks, piecing together block code. The hardware that made high school robotics fun and advanced? Way too expensive for our old school. We never got to fry a real servo at ten, so we built something that starts at zero, because we remember what zero feels like.\n\n## How we build\n\nEvery kit ships with open-source hardware and guided curriculum we wrote ourselves. You assemble it, wire it, and write the code, we don''t do it for you, because that''s not how you actually learn anything. To keep costs down, we 3D print the structural parts ourselves. It allows us to rapidly prototype while still being firm enough for real use. It''s lighter than machined aluminum, and affordable enough that we don''t have to pass a markup on to you. The electronics in each kit are also selected for what they can teach you. We try our best to make each kit distinct enough where you''ll learn something new in each one.';
  hero_json jsonb;
  story_row text;
BEGIN
  IF to_regclass('public.page_content') IS NOT NULL THEN
    -- about_hero stored a JSON object in its text column; parse defensively.
    BEGIN
      SELECT content::jsonb INTO hero_json FROM public.page_content WHERE page_key = 'about_hero';
      IF hero_json IS NOT NULL THEN
        hero_headline := COALESCE(NULLIF(hero_json->>'headline', ''), hero_headline);
        hero_description := COALESCE(NULLIF(hero_json->>'description', ''), hero_description);
      END IF;
    EXCEPTION WHEN others THEN
      NULL; -- unparseable content keeps the fallbacks
    END;

    SELECT content INTO story_row FROM public.page_content WHERE page_key = 'about_story';
    story := COALESCE(NULLIF(story_row, ''), story);

    -- Legal pages by fixed key, custom pages by their slug. Unpublished rows
    -- migrate as drafts.
    FOR rec IN
      SELECT
        CASE WHEN is_custom_page THEN slug ELSE page_key END AS key,
        title, content, seo_title, seo_description, show_last_updated,
        published_at IS NOT NULL AS is_published
      FROM public.page_content
      WHERE (page_key IN ('privacy', 'terms') OR is_custom_page = true)
        AND COALESCE(content, '') <> ''
        AND COALESCE(title, '') <> ''
        AND CASE WHEN is_custom_page THEN slug IS NOT NULL ELSE true END
    LOOP
      PERFORM pg_temp.seed_doc('page', rec.key, jsonb_build_object(
        'title', rec.title,
        'body', rec.content,
        'seoTitle', COALESCE(rec.seo_title, ''),
        'seoDescription', COALESCE(rec.seo_description, ''),
        'showLastUpdated', COALESCE(rec.show_last_updated, true)
      ), rec.is_published);
    END LOOP;
  END IF;

  PERFORM pg_temp.seed_doc('about_page', 'default', jsonb_build_object(
    'heroHeadline', hero_headline,
    'heroDescription', hero_description,
    'story', story
  ), true);
END $$;

DROP TABLE IF EXISTS public.page_content;

DROP FUNCTION pg_temp.seed_doc(text, text, jsonb, boolean);
