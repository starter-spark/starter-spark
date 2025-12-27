import { createBrowserClient } from '@supabase/ssr'
import { type Database } from './database.types'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

export function createClient() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
