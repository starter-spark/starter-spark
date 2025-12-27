import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TeapotContent } from './TeapotContent'

export const metadata: Metadata = {
  title: "418 - I'm a teapot",
  description: 'This server is a teapot, not a coffee machine.',
  robots: 'noindex, nofollow',
}

async function trackAndGetCount(): Promise<number> {
  try {
    const supabase = await createClient()

    // Track unique viewer (only increments once per user)
    const { data } = await supabase.rpc('track_teapot_view')

    return (data as number) ?? 0
  } catch {
    return 0
  }
}

export default async function TeapotPage() {
  const viewCount = await trackAndGetCount()
  return <TeapotContent viewCount={viewCount} />
}
