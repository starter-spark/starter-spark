-- Team members and banners move into the CMS engine as collections, and the
-- homepage "why us" cards become a real collection instead of fixed fields.
-- Every consumer moved in the same change that ships this migration.
--
-- Seeds read the live legacy rows at apply time. Legacy row ids become the
-- CMS entry keys, which keeps banner dismissals (localStorage keyed by id)
-- intact across the migration. Replay-safe: seeding skips existing keys and
-- tolerates the legacy tables being gone.

CREATE FUNCTION pg_temp.seed_entry(t text, k text, s numeric, d jsonb) RETURNS void AS $f$
DECLARE
  doc_id uuid;
  ver_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.cms_documents WHERE type = t AND key = k) THEN
    RETURN;
  END IF;
  INSERT INTO public.cms_documents (type, key, sort_order)
    VALUES (t, k, s)
    RETURNING id INTO doc_id;
  INSERT INTO public.cms_versions (document_id, version, data, note)
    VALUES (doc_id, 1, d, 'Migrated from legacy table')
    RETURNING id INTO ver_id;
  UPDATE public.cms_documents SET published_version_id = ver_id WHERE id = doc_id;
END $f$ LANGUAGE plpgsql;

DO $$
DECLARE
  rec record;
  diff jsonb;
BEGIN
  IF to_regclass('public.team_members') IS NOT NULL THEN
    FOR rec IN SELECT * FROM public.team_members ORDER BY sort_order LOOP
      PERFORM pg_temp.seed_entry('team_member', rec.id::text, COALESCE(rec.sort_order, 0), jsonb_build_object(
        'name', rec.name,
        'role', rec.role,
        'bio', COALESCE(rec.bio, ''),
        'imageUrl', COALESCE(rec.image_url, ''),
        'githubUrl', COALESCE(rec.social_links->>'github', ''),
        'linkedinUrl', COALESCE(rec.social_links->>'linkedin', ''),
        'twitterUrl', COALESCE(rec.social_links->>'twitter', ''),
        'visible', COALESCE(rec.is_active, true)
      ));
    END LOOP;
  END IF;

  IF to_regclass('public.site_banners') IS NOT NULL THEN
    FOR rec IN SELECT * FROM public.site_banners ORDER BY sort_order LOOP
      PERFORM pg_temp.seed_entry('banner', rec.id::text, COALESCE(rec.sort_order, 0), jsonb_build_object(
        'title', COALESCE(NULLIF(rec.title, ''), 'Banner'),
        'message', rec.message,
        'colorScheme', CASE WHEN rec.color_scheme IN ('info','warning','success','error','sale','promo','announcement','gift') THEN rec.color_scheme ELSE 'info' END,
        'linkText', COALESCE(rec.link_text, ''),
        'linkUrl', COALESCE(rec.link_url, ''),
        'dismissible', COALESCE(rec.is_dismissible, true),
        'dismissHours', GREATEST(COALESCE(rec.dismiss_duration_hours, 0), 0),
        'pages', COALESCE(NULLIF(array_to_string(rec.pages, ', '), ''), '*'),
        'startsAt', CASE WHEN rec.starts_at IS NULL THEN '' ELSE trim(both '"' from to_json(rec.starts_at)::text) END,
        'endsAt', CASE WHEN rec.ends_at IS NULL THEN '' ELSE trim(both '"' from to_json(rec.ends_at)::text) END,
        'visible', COALESCE(rec.is_active, true)
      ));
    END LOOP;
  END IF;

  -- The four "why us" cards: values come from the published
  -- home_differentiators document (which previously carried them as fixed
  -- fields); the document itself keeps only the section heading. Old
  -- versions retain the card fields in history; the schema ignores them.
  SELECT v.data INTO diff
    FROM public.cms_documents d
    JOIN public.cms_versions v ON v.id = d.published_version_id
    WHERE d.type = 'home_differentiators' AND d.key = 'default';

  PERFORM pg_temp.seed_entry('differentiator_card', 'card-1', 1, jsonb_build_object(
    'title', COALESCE(diff->>'card1Title', 'Complete Package'),
    'description', COALESCE(diff->>'card1Description', 'Everything you need in one box: pre-cut parts, electronics, fasteners, and our step-by-step digital curriculum. No hunting for components or compatibility issues.'),
    'icon', 'package',
    'visible', true
  ));
  PERFORM pg_temp.seed_entry('differentiator_card', 'card-2', 2, jsonb_build_object(
    'title', COALESCE(diff->>'card2Title', 'Interactive Curriculum'),
    'description', COALESCE(diff->>'card2Description', 'The platform has interactive wiring diagrams, a built-in code editor, and progress tracking across lessons. You can see where every wire goes before you touch anything, which honestly saves a lot of frustration.'),
    'icon', 'graduation-cap',
    'visible', true
  ));
  PERFORM pg_temp.seed_entry('differentiator_card', 'card-3', 3, jsonb_build_object(
    'title', COALESCE(diff->>'card3Title', 'Support for Schools and Clubs'),
    'description', COALESCE(diff->>'card3Description', 'We offer bulk discounts for schools and clubs, and the kits come classroom-ready so you don''t have to figure out sourcing. If you''re trying to set up a robotics program and don''t know where to start, just email us.'),
    'icon', 'users',
    'visible', true
  ));
  PERFORM pg_temp.seed_entry('differentiator_card', 'card-4', 4, jsonb_build_object(
    'title', COALESCE(diff->>'card4Title', 'Hawaii Roots'),
    'description', COALESCE(diff->>'card4Description', 'We''re students from Hawaii who couldn''t find a good beginner robotics kit, so we built one. Everything was tested by real students before we shipped anything.'),
    'icon', 'map-pin',
    'visible', true
  ));
END $$;

DROP TABLE IF EXISTS public.team_members;
DROP TABLE IF EXISTS public.site_banners;
DROP FUNCTION IF EXISTS public.update_site_banners_updated_at();

DROP FUNCTION pg_temp.seed_entry(text, text, numeric, jsonb);
