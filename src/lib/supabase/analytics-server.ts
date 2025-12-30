import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type AnalyticsDatabase } from './analytics-database.types'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

export async function createAnalyticsClient() {
  const cookieStore = await cookies()
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  return createServerClient<AnalyticsDatabase>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet)
            cookieStore.set(name, value, options)
        } catch {
          // Server component, safe to ignore.
        }
      },
    },
  })
}

