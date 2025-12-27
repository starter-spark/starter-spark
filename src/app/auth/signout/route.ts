import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Sign out from Supabase
  await supabase.auth.signOut()

  // Check if there's a redirect URL in the request
  const formData = await request.formData().catch(() => null)
  const redirectParam = formData?.get('redirect')
  const redirectTo = typeof redirectParam === 'string' ? redirectParam : '/'

  // Validate redirect URL to prevent open redirect
  const safeRedirect =
    redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/'

  redirect(safeRedirect)
}

// Also support GET for convenience (direct link)
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Sign out from Supabase
  await supabase.auth.signOut()

  // Get redirect from query params
  const searchParams = request.nextUrl.searchParams
  const redirectTo = searchParams.get('redirect') || '/'

  // Validate redirect URL to prevent open redirect
  const safeRedirect =
    redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/'

  redirect(safeRedirect)
}
