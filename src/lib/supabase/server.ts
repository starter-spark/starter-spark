import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from './database.types'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
