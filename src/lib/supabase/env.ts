const SUPABASE_URL_KEYS = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const
const SUPABASE_ANON_KEY_KEYS = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
] as const
const SUPABASE_SERVICE_ROLE_KEY_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
] as const

function missingEnvError(keys: readonly string[]): Error {
  return new Error(`Missing environment variable: ${keys.join(" or ")}`)
}

export function getSupabaseUrl(): string {
  const value = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!value) throw missingEnvError(SUPABASE_URL_KEYS)
  return value
}

export function getSupabaseAnonKey(): string {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  if (!value) throw missingEnvError(SUPABASE_ANON_KEY_KEYS)
  return value
}

export function getSupabaseServiceRoleKey(): string {
  const value =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!value) throw missingEnvError(SUPABASE_SERVICE_ROLE_KEY_KEYS)
  return value
}
