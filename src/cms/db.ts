// Server-only by inheritance: '@/lib/supabase/admin' throws when bundled
// for the browser, matching the repo's existing guard pattern.
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'

export type CmsDocumentRow =
  Database['public']['Tables']['cms_documents']['Row']
export type CmsVersionRow = Database['public']['Tables']['cms_versions']['Row']
export type CmsPublishedRow =
  Database['public']['Views']['cms_published']['Row']

export const cmsDb = supabaseAdmin
