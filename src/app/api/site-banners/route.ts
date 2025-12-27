import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit'

export const runtime = 'nodejs'

type BannerRow = {
  id: string
  title: string
  message: string
  link_url: string | null
  link_text: string | null
  icon: string | null
  color_scheme: string | null
  pages: string[] | null
  is_dismissible: boolean | null
  dismiss_duration_hours: number | null
  starts_at: string | null
  ends_at: string | null
  is_active: boolean | null
}

export async function GET(request: Request) {
  const rateLimitResponse = await rateLimit(request, 'siteBanners')
  if (rateLimitResponse) return rateLimitResponse

  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('site_banners')
    .select(
      'id, title, message, link_url, link_text, icon, color_scheme, pages, is_dismissible, dismiss_duration_hours, starts_at, ends_at, is_active',
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const now = Date.now()
  const visible = ((data as BannerRow[] | null) || [])
    .filter((banner) => {
      if (banner.starts_at && now < Date.parse(banner.starts_at)) return false
      if (banner.ends_at && now > Date.parse(banner.ends_at)) return false
      return true
    })
    .map((banner) => ({
      id: banner.id,
      title: banner.title,
      message: banner.message,
      link_url: banner.link_url,
      link_text: banner.link_text,
      icon: banner.icon,
      color_scheme: banner.color_scheme,
      pages: banner.pages,
      is_dismissible: banner.is_dismissible,
      dismiss_duration_hours: banner.dismiss_duration_hours,
    }))

  return NextResponse.json(visible, {
    headers: {
      'Cache-Control': 'no-store',
      ...rateLimitHeaders('siteBanners'),
    },
  })
}
