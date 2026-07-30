import { getCollection } from '@/cms/content'
import { SiteBanner, type BannerProps } from './SiteBanner'

type BannerEntry = Awaited<ReturnType<typeof getCollection<'banner'>>>[number]

// Schedule window check lives outside the component body: server components
// legitimately evaluate wall-clock time per request.
function isLive(e: BannerEntry, now = Date.now()): boolean {
  if (!e.data.visible) return false
  if (e.data.startsAt && Date.parse(e.data.startsAt) > now) return false
  if (e.data.endsAt && Date.parse(e.data.endsAt) < now) return false
  return true
}

/**
 * Server side of the banner system: banners arrive with the page instead of
 * popping in from a client fetch. The schedule window is evaluated here on
 * every request (the collection read itself is cached and tag-revalidated).
 */
export async function SiteBannerWrapper() {
  const entries = await getCollection('banner')

  const banners: BannerProps[] = entries
    .filter((e) => isLive(e))
    .map((e) => ({
      id: e.key,
      message: e.data.message,
      colorScheme: e.data.colorScheme,
      linkText: e.data.linkText,
      linkUrl: e.data.linkUrl,
      dismissible: e.data.dismissible,
      dismissHours: e.data.dismissHours,
      pages: e.data.pages
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
    }))

  if (banners.length === 0) return null

  return <SiteBanner banners={banners} />
}
