"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { X, Info, AlertTriangle, CheckCircle, XCircle, Tag, Zap, Gift, Megaphone } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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

// Status banners - for system messages, alerts, confirmations
// Promotional banners - for sales, announcements, special offers
const COLOR_SCHEMES: Record<string, {
  bg: string
  text: string
  border: string
  icon: typeof Info
  linkStyle: string
  dismissStyle: string
}> = {
  // Status banners
  info: {
    bg: "bg-cyan-50",
    text: "text-cyan-800",
    border: "border-cyan-200",
    icon: Info,
    linkStyle: "text-cyan-700 hover:text-cyan-900",
    dismissStyle: "hover:bg-cyan-100",
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: AlertTriangle,
    linkStyle: "text-amber-700 hover:text-amber-900",
    dismissStyle: "hover:bg-amber-100",
  },
  success: {
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-200",
    icon: CheckCircle,
    linkStyle: "text-green-700 hover:text-green-900",
    dismissStyle: "hover:bg-green-100",
  },
  error: {
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
    icon: XCircle,
    linkStyle: "text-red-700 hover:text-red-900",
    dismissStyle: "hover:bg-red-100",
  },
  // Promotional banners
  sale: {
    bg: "bg-rose-600",
    text: "text-white",
    border: "border-rose-700",
    icon: Tag,
    linkStyle: "text-rose-100 hover:text-white",
    dismissStyle: "hover:bg-rose-700",
  },
  promo: {
    bg: "bg-violet-600",
    text: "text-white",
    border: "border-violet-700",
    icon: Zap,
    linkStyle: "text-violet-100 hover:text-white",
    dismissStyle: "hover:bg-violet-700",
  },
  announcement: {
    bg: "bg-slate-800",
    text: "text-white",
    border: "border-slate-900",
    icon: Megaphone,
    linkStyle: "text-slate-200 hover:text-white",
    dismissStyle: "hover:bg-slate-700",
  },
  gift: {
    bg: "bg-emerald-600",
    text: "text-white",
    border: "border-emerald-700",
    icon: Gift,
    linkStyle: "text-emerald-100 hover:text-white",
    dismissStyle: "hover:bg-emerald-700",
  },
}

function getDismissKey(bannerId: string) {
  return `banner_dismissed_${bannerId}`
}

function isDismissed(bannerId: string, dismissDurationHours: number | null): boolean {
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
  if (pages.includes("*")) return true

  // Check exact match or prefix match (for nested routes)
  return pages.some(page => {
    if (page === currentPath) return true
    // Allow /shop to match /shop/product-slug
    if (currentPath.startsWith(page + "/")) return true
    return false
  })
}

export function SiteBanner() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    async function fetchBanners() {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("site_banners")
        .select("id, title, message, link_url, link_text, icon, color_scheme, pages, is_dismissible, dismiss_duration_hours")
        .order("sort_order", { ascending: true })

      if (error) {
        console.error("Failed to fetch banners:", error.message)
        setIsLoading(false)
        return
      }

      // Transform data to match Banner interface with defaults
      const transformedBanners: Banner[] = (data || []).map(b => ({
        id: b.id,
        title: b.title,
        message: b.message,
        link_url: b.link_url,
        link_text: b.link_text,
        icon: b.icon,
        color_scheme: b.color_scheme || "info",
        pages: b.pages || [],
        is_dismissible: b.is_dismissible ?? true,
        dismiss_duration_hours: b.dismiss_duration_hours,
      }))

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
    }

    void fetchBanners()
  }, [])

  const handleDismiss = (bannerId: string) => {
    dismissBanner(bannerId)
    setDismissedIds(prev => new Set([...prev, bannerId]))
  }

  // Filter banners for current page and not dismissed
  const visibleBanners = banners.filter(banner =>
    shouldShowOnPage(banner.pages, pathname) && !dismissedIds.has(banner.id)
  )

  if (isLoading || visibleBanners.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      {visibleBanners.map((banner) => {
        const scheme = COLOR_SCHEMES[banner.color_scheme] || COLOR_SCHEMES.info
        const IconComponent = scheme.icon

        return (
          <motion.div
            key={banner.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className={`${scheme.bg} ${scheme.text} border-b ${scheme.border}`}>
              <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 relative">
                <div className="flex items-center gap-2.5">
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm font-medium">
                    {banner.message}
                  </p>
                </div>

                {banner.link_url && banner.link_text && (
                  <Link
                    href={banner.link_url}
                    className={`text-sm font-semibold underline underline-offset-2 hover:no-underline transition-colors ${scheme.linkStyle}`}
                  >
                    {banner.link_text}
                  </Link>
                )}

                {banner.is_dismissible && (
                  <button
                    onClick={() => { handleDismiss(banner.id); }}
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
