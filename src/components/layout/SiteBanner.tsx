'use client'

import { useSyncExternalStore } from 'react'
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

export interface BannerProps {
  id: string
  message: string
  colorScheme: string
  linkText: string
  linkUrl: string
  dismissible: boolean
  /** 0 = a dismissed banner stays dismissed forever */
  dismissHours: number
  pages: string[]
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

function isDismissed(bannerId: string, dismissHours: number): boolean {
  if (globalThis.window === undefined) return false

  const dismissedAt = localStorage.getItem(getDismissKey(bannerId))
  if (!dismissedAt) return false

  // 0 hours = banner stays dismissed forever
  if (dismissHours === 0) return true

  const dismissedTime = Number.parseInt(dismissedAt, 10)
  const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60)

  return hoursSinceDismissed < dismissHours
}

// Dismissal state lives in localStorage; components subscribe through a tiny
// external store so hydration renders the server HTML first (nothing
// dismissed) and reconciles immediately after.
const dismissListeners = new Set<() => void>()

function subscribeDismissals(callback: () => void): () => void {
  dismissListeners.add(callback)
  return () => {
    dismissListeners.delete(callback)
  }
}

function dismissBanner(bannerId: string) {
  if (globalThis.window === undefined) return
  localStorage.setItem(getDismissKey(bannerId), Date.now().toString())
  for (const listener of dismissListeners) listener()
}

function shouldShowOnPage(pages: string[], currentPath: string): boolean {
  // Show on all pages if pages contains "*"
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

export function SiteBanner({ banners }: { banners: BannerProps[] }) {
  const pathname = usePathname()
  // One char per banner: '1' = dismissed. The server snapshot reports nothing
  // dismissed, matching the server-rendered HTML; the client snapshot takes
  // over right after hydration.
  const dismissedMask = useSyncExternalStore(
    subscribeDismissals,
    () =>
      banners
        .map((b) => (isDismissed(b.id, b.dismissHours) ? '1' : '0'))
        .join(''),
    () => '0'.repeat(banners.length),
  )

  const visibleBanners = banners.filter(
    (banner, index) =>
      shouldShowOnPage(banner.pages, pathname) &&
      dismissedMask.charAt(index) !== '1',
  )

  if (visibleBanners.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      {visibleBanners.map((banner) => {
        const scheme = COLOR_SCHEMES[banner.colorScheme] || COLOR_SCHEMES.info
        const IconComponent = scheme.icon
        const safeLinkUrl = getSafeLinkUrl(banner.linkUrl)

        return (
          <motion.div
            key={banner.id}
            initial={false}
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

                {safeLinkUrl && banner.linkText && (
                  <Link
                    href={safeLinkUrl}
                    className={`text-sm font-semibold underline underline-offset-2 hover:no-underline transition-colors ${scheme.linkStyle}`}
                  >
                    {banner.linkText}
                  </Link>
                )}

                {banner.dismissible && (
                  <button
                    onClick={() => {
                      dismissBanner(banner.id)
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
