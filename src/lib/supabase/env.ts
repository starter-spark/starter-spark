const SUPABASE_URL_KEYS = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const
const SUPABASE_ANON_KEY_KEYS = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
] as const
const SUPABASE_SERVICE_ROLE_KEY_KEYS = [
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
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
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (publishable) return publishable

  const legacy =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  if (!legacy) throw missingEnvError(SUPABASE_ANON_KEY_KEYS)

  if (process.env.NODE_ENV === "production") {
    console.warn("[supabase] Legacy anon key in use; set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.")
  }
  return legacy
}

export function getSupabaseServiceRoleKey(): string {
  const secret = process.env.SUPABASE_SECRET_KEY
  if (secret) return secret

  const legacy = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!legacy) throw missingEnvError(SUPABASE_SERVICE_ROLE_KEY_KEYS)

  if (process.env.NODE_ENV === "production") {
    console.warn("[supabase] Legacy service role key in use; set SUPABASE_SECRET_KEY.")
  }
  return legacy
}
