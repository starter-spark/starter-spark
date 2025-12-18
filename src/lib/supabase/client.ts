import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

export function createClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL')
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
