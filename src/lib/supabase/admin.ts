import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Service role client for privileged operations (server-side only)
// WARNING: Never expose this client or the service role key to the browser
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
