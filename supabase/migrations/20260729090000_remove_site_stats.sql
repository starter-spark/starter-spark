-- site_stats is fully replaced by the CMS impact_stat collection (same data,
-- versioned, admin-orderable, honest rendering). Its last consumer moved in
-- the same change that ships this migration.

-- The About page previously hardcoded a "Donated to STEM" stat from
-- global.charity.percentage; it becomes a regular impact_stat entry with the
-- decided claim (30%), editable like any other stat.
DO $$
DECLARE
  doc_id uuid;
  ver_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cms_documents WHERE type = 'impact_stat' AND key = 'stem_donation') THEN
    INSERT INTO public.cms_documents (type, key, sort_order)
      VALUES ('impact_stat', 'stem_donation', 4)
      RETURNING id INTO doc_id;
    INSERT INTO public.cms_versions (document_id, version, data, note)
      VALUES (doc_id, 1, jsonb_build_object(
        'label', 'Donated to STEM',
        'value', '30',
        'suffix', '%',
        'autoSource', 'none',
        'visible', true
      ), 'Migrated from About page hardcoded charity stat')
      RETURNING id INTO ver_id;
    UPDATE public.cms_documents SET published_version_id = ver_id WHERE id = doc_id;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.get_site_stats(text);
DROP FUNCTION IF EXISTS public.get_site_stats();
DROP FUNCTION IF EXISTS public.increment_stat(text, integer);
DROP FUNCTION IF EXISTS public.increment_stat(text);
DROP TABLE IF EXISTS public.site_stats;
DROP FUNCTION IF EXISTS public.update_site_stats_updated_at();
