"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { X, Info, AlertTriangle, CheckCircle, XCircle, Sparkles } from "lucide-react"
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
  color_scheme: "info" | "warning" | "success" | "error" | "promo"
  pages: string[]
  is_dismissible: boolean
  dismiss_duration_hours: number | null
}

const COLOR_SCHEMES = {
  info: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    icon: Info,
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: AlertTriangle,
  },
  success: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    icon: CheckCircle,
  },
  error: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: XCircle,
  },
  promo: {
    bg: "bg-gradient-to-r from-cyan-600 to-purple-600",
    text: "text-white",
    border: "border-transparent",
    icon: Sparkles,
  },
}

function getDismissKey(bannerId: string) {
  return `banner_dismissed_${bannerId}`
}

function isDismissed(bannerId: string, dismissDurationHours: number | null): boolean {
  if (typeof window === "undefined") return false

  const dismissedAt = localStorage.getItem(getDismissKey(bannerId))
  if (!dismissedAt) return false

  // If dismiss_duration_hours is null, banner stays dismissed forever
  if (dismissDurationHours === null) return true

  // Check if enough time has passed
  const dismissedTime = parseInt(dismissedAt, 10)
  const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60)

  return hoursSinceDismissed < dismissDurationHours
}

function dismissBanner(bannerId: string) {
  if (typeof window === "undefined") return
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
        color_scheme: (b.color_scheme as Banner["color_scheme"]) || "info",
        pages: b.pages || [],
        is_dismissible: b.is_dismissible ?? true,
        dismiss_duration_hours: b.dismiss_duration_hours,
      }))

      setBanners(transformedBanners)

      // Check which banners are already dismissed
      const dismissed = new Set<string>()
      transformedBanners.forEach(banner => {
        if (isDismissed(banner.id, banner.dismiss_duration_hours)) {
          dismissed.add(banner.id)
        }
      })
      setDismissedIds(dismissed)
      setIsLoading(false)
    }

    fetchBanners()
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
    <div className="relative z-50">
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
              transition={{ duration: 0.3 }}
              className={`${scheme.bg} ${scheme.text} border-b ${scheme.border} overflow-hidden`}
            >
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
                <IconComponent className="w-4 h-4 flex-shrink-0" />

                <p className="text-sm font-medium text-center">
                  {banner.message}
                  {banner.link_url && banner.link_text && (
                    <>
                      {" "}
                      <Link
                        href={banner.link_url}
                        className={`underline hover:no-underline font-semibold ${
                          banner.color_scheme === "promo" ? "text-white" : ""
                        }`}
                      >
                        {banner.link_text}
                      </Link>
                    </>
                  )}
                </p>

                {banner.is_dismissible && (
                  <button
                    onClick={() => handleDismiss(banner.id)}
                    className={`p-1 rounded hover:bg-black/10 transition-colors flex-shrink-0 ${
                      banner.color_scheme === "promo" ? "hover:bg-white/20" : ""
                    }`}
                    aria-label="Dismiss banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
