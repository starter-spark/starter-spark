import { createClient } from '@supabase/supabase-js'
import { type Database } from './database.types'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env'

// Service role client for privileged operations (server-side only)
// WARNING: Never expose this client or the service role key to the browser
if (typeof window !== 'undefined') {
  throw new TypeError(
    'supabaseAdmin must not be imported in the browser bundle',
  )
}

const supabaseUrl = getSupabaseUrl()
const supabaseServiceRoleKey = getSupabaseServiceRoleKey()

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
