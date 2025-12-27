import { createClient } from '@supabase/supabase-js'
import { type Database } from './database.types'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

// Public (anon) client for server-side data that should be static-safe.
export function createPublicClient() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
