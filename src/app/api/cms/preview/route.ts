import { NextRequest, NextResponse } from 'next/server'
import { draftMode } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { requireAdminOrStaff } from '@/lib/auth'

/**
 * Toggle CMS preview (Next.js draft mode). While enabled, public pages read
 * draft content instead of published content — for this browser only.
 * GET /api/cms/preview?redirect=/            enable and go look
 * GET /api/cms/preview?disable=1&redirect=/  back to published
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const guard = await requireAdminOrStaff(supabase)
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: 403 })
  }

  const params = request.nextUrl.searchParams
  const redirectTo = params.get('redirect') || '/'
  // Only allow same-origin relative redirects
  const safeRedirect =
    redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/'

  const draft = await draftMode()
  if (params.get('disable')) {
    draft.disable()
  } else {
    draft.enable()
  }

  return NextResponse.redirect(new URL(safeRedirect, request.nextUrl.origin))
}
