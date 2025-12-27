'use client'

import { useEffect, useState } from 'react'
import {
  X,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Tag,
  Zap,
  Gift,
  Megaphone,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Banner {
  id: string
  title: string
  message: string
  link_url: string | null
  link_text: string | null
  icon: string | null
  color_scheme: string
  pages: string[]
  is_dismissible: boolean
  dismiss_duration_hours: number | null
}

// Status banners: system messages.
// Promo banners: sales and announcements.
const COLOR_SCHEMES: Record<
  string,
  {
    bg: string
    text: string
    border: string
    icon: typeof Info
    linkStyle: string
    dismissStyle: string
  }
> = {
  // Status banners
  info: {
    bg: 'bg-cyan-50',
    text: 'text-slate-900',
    border: 'border-cyan-200',
    icon: Info,
    linkStyle: 'text-cyan-800 hover:text-cyan-900',
    dismissStyle: 'hover:bg-cyan-100',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: AlertTriangle,
    linkStyle: 'text-amber-700 hover:text-amber-900',
    dismissStyle: 'hover:bg-amber-100',
  },
  success: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: CheckCircle,
    linkStyle: 'text-green-700 hover:text-green-900',
    dismissStyle: 'hover:bg-green-100',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: XCircle,
    linkStyle: 'text-red-700 hover:text-red-900',
    dismissStyle: 'hover:bg-red-100',
  },
  // Promotional banners
  sale: {
    bg: 'bg-rose-600',
    text: 'text-white',
    border: 'border-rose-700',
    icon: Tag,
    linkStyle: 'text-rose-100 hover:text-white',
    dismissStyle: 'hover:bg-rose-700',
  },
  promo: {
    bg: 'bg-violet-600',
    text: 'text-white',
    border: 'border-violet-700',
    icon: Zap,
    linkStyle: 'text-violet-100 hover:text-white',
    dismissStyle: 'hover:bg-violet-700',
  },
  announcement: {
    bg: 'bg-slate-800',
    text: 'text-white',
    border: 'border-slate-900',
    icon: Megaphone,
    linkStyle: 'text-slate-200 hover:text-white',
    dismissStyle: 'hover:bg-slate-700',
  },
  gift: {
    bg: 'bg-emerald-600',
    text: 'text-white',
    border: 'border-emerald-700',
    icon: Gift,
    linkStyle: 'text-emerald-100 hover:text-white',
    dismissStyle: 'hover:bg-emerald-700',
  },
}

function getDismissKey(bannerId: string) {
  return `banner_dismissed_${bannerId}`
}

function isDismissed(
  bannerId: string,
  dismissDurationHours: number | null,
): boolean {
  if (globalThis.window === undefined) return false

  const dismissedAt = localStorage.getItem(getDismissKey(bannerId))
  if (!dismissedAt) return false

  // If dismiss_duration_hours is null, banner stays dismissed forever
  if (dismissDurationHours === null) return true

  // Check if enough time has passed
  const dismissedTime = Number.parseInt(dismissedAt, 10)
  const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60)

  return hoursSinceDismissed < dismissDurationHours
}

function dismissBanner(bannerId: string) {
  if (globalThis.window === undefined) return
  localStorage.setItem(getDismissKey(bannerId), Date.now().toString())
}

function shouldShowOnPage(pages: string[], currentPath: string): boolean {
  // Show on all pages if pages array contains "*"
  if (pages.includes('*')) return true

  // Check exact match or prefix match (for nested routes)
  return pages.some((page) => {
    if (page === currentPath) return true
    // Allow /shop to match /shop/product-slug
    if (currentPath.startsWith(page + '/')) return true
    return false
  })
}

function getSafeLinkUrl(linkUrl: string): string | null {
  const trimmed = linkUrl.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/')) {
    return trimmed.startsWith('//') ? null : trimmed
  }
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed
    }
  } catch {
    return null
  }
  return null
}

export function SiteBanner() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    async function fetchBanners() {
      try {
        const response = await fetch('/api/site-banners', { cache: 'no-store' })
        if (!response.ok) {
          const payload: unknown = await response.json().catch(() => null)
          const message =
            typeof payload === 'object' &&
            payload !== null &&
            'error' in payload &&
            typeof (payload as { error?: unknown }).error === 'string'
              ? (payload as { error: string }).error
              : 'Unknown error'
          console.error('Failed to fetch banners:', message)
          setIsLoading(false)
          return
        }
        const data: unknown = await response.json().catch(() => [])
        const rawBanners = Array.isArray(data) ? data : []

        // Transform data to match Banner interface with defaults
        const transformedBanners: Banner[] = rawBanners.flatMap((item) => {
          if (!item || typeof item !== 'object') return []
          const b = item as Partial<Banner>
          if (
            typeof b.id !== 'string' ||
            typeof b.title !== 'string' ||
            typeof b.message !== 'string'
          ) {
            return []
          }

          const pages = Array.isArray(b.pages)
            ? b.pages.filter((page) => typeof page === 'string')
            : []

          return [
            {
              id: b.id,
              title: b.title,
              message: b.message,
              link_url: typeof b.link_url === 'string' ? b.link_url : null,
              link_text: typeof b.link_text === 'string' ? b.link_text : null,
              icon: typeof b.icon === 'string' ? b.icon : null,
              color_scheme:
                typeof b.color_scheme === 'string' && b.color_scheme
                  ? b.color_scheme
                  : 'info',
              pages,
              is_dismissible:
                typeof b.is_dismissible === 'boolean' ? b.is_dismissible : true,
              dismiss_duration_hours:
                typeof b.dismiss_duration_hours === 'number'
                  ? b.dismiss_duration_hours
                  : null,
            },
          ]
        })

        setBanners(transformedBanners)

        // Check which banners are already dismissed
        const dismissed = new Set<string>()
        for (const banner of transformedBanners) {
          if (isDismissed(banner.id, banner.dismiss_duration_hours)) {
            dismissed.add(banner.id)
          }
        }
        setDismissedIds(dismissed)
        setIsLoading(false)
        return
      } catch (error) {
        console.error('Failed to fetch banners:', error)
        setIsLoading(false)
        return
      }
    }

    void fetchBanners()
  }, [])

  const handleDismiss = (bannerId: string) => {
    dismissBanner(bannerId)
    setDismissedIds((prev) => new Set([...prev, bannerId]))
  }

  // Filter banners for current page and not dismissed
  const visibleBanners = banners.filter(
    (banner) =>
      shouldShowOnPage(banner.pages, pathname) && !dismissedIds.has(banner.id),
  )

  if (isLoading || visibleBanners.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      {visibleBanners.map((banner) => {
        const scheme = COLOR_SCHEMES[banner.color_scheme] || COLOR_SCHEMES.info
        const IconComponent = scheme.icon
        const safeLinkUrl = banner.link_url
          ? getSafeLinkUrl(banner.link_url)
          : null

        return (
          <motion.div
            key={banner.id}
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div
              className={`${scheme.bg} ${scheme.text} border-b ${scheme.border}`}
            >
              <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 relative">
                <div className="flex items-center gap-2.5">
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  <p className={`text-sm font-medium ${scheme.text}`}>
                    {banner.message}
                  </p>
                </div>

                {safeLinkUrl && banner.link_text && (
                  <Link
                    href={safeLinkUrl}
                    className={`text-sm font-semibold underline underline-offset-2 hover:no-underline transition-colors ${scheme.linkStyle}`}
                  >
                    {banner.link_text}
                  </Link>
                )}

                {banner.is_dismissible && (
                  <button
                    onClick={() => {
                      handleDismiss(banner.id)
                    }}
                    className={`absolute right-4 p-1.5 rounded-full transition-colors ${scheme.dismissStyle}`}
                    aria-label="Dismiss banner"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </AnimatePresence>
  )
}
