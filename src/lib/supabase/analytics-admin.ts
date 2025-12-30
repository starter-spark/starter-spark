import { createClient } from '@supabase/supabase-js'
import { type AnalyticsDatabase } from './analytics-database.types'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env'

if (typeof window !== 'undefined') {
  throw new TypeError(
    'supabaseAnalyticsAdmin must not be imported in the browser bundle',
  )
}

const supabaseUrl = getSupabaseUrl()
const supabaseServiceRoleKey = getSupabaseServiceRoleKey()

export const supabaseAnalyticsAdmin = createClient<AnalyticsDatabase>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

