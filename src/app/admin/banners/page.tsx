import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Megaphone, Info, AlertTriangle, CheckCircle, XCircle, Tag, Zap, Gift } from "lucide-react"
import { BannerActions } from "./BannerActions"

export const metadata = {
  title: "Banners | Admin",
}

function getColorSchemeIcon(colorScheme: string): typeof Info {
  switch (colorScheme) {
    case "info":
      return Info
    case "warning":
      return AlertTriangle
    case "success":
      return CheckCircle
    case "error":
      return XCircle
    case "sale":
      return Tag
    case "promo":
      return Zap
    case "announcement":
      return Megaphone
    case "gift":
      return Gift
    default:
      return Info
  }
}

function getColorSchemeStyle(colorScheme: string): string {
  switch (colorScheme) {
    case "info":
      return "bg-cyan-100 text-cyan-700"
    case "warning":
      return "bg-amber-100 text-amber-700"
    case "success":
      return "bg-green-100 text-green-700"
    case "error":
      return "bg-red-100 text-red-700"
    case "sale":
      return "bg-rose-100 text-rose-700"
    case "promo":
      return "bg-violet-100 text-violet-700"
    case "announcement":
      return "bg-slate-200 text-slate-700"
    case "gift":
      return "bg-emerald-100 text-emerald-700"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

async function getBanners() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("site_banners")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching banners:", error)
    return []
  }

  return data
}

export default async function BannersPage() {
  const banners = await getBanners()

  const now = new Date()
  const activeBanners = banners.filter(
    (b) =>
      b.is_active &&
      (!b.starts_at || new Date(b.starts_at) <= now) &&
      (!b.ends_at || new Date(b.ends_at) > now)
  )
  const scheduledBanners = banners.filter(
    (b) => b.is_active && b.starts_at && new Date(b.starts_at) > now
  )
  const inactiveBanners = banners.filter((b) => !b.is_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-slate-900">Banners</h1>
          <p className="text-slate-600">Manage site-wide announcements and promotions</p>
        </div>
        <Link href="/admin/banners/new">
          <Button className="bg-cyan-700 hover:bg-cyan-600">
            <Plus className="mr-2 h-4 w-4" />
            Create Banner
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Total Banners</p>
          <p className="font-mono text-2xl font-bold text-slate-900">{banners.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Active Now</p>
          <p className="font-mono text-2xl font-bold text-green-600">{activeBanners.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Scheduled</p>
          <p className="font-mono text-2xl font-bold text-cyan-700">{scheduledBanners.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Inactive</p>
          <p className="font-mono text-2xl font-bold text-slate-500">{inactiveBanners.length}</p>
        </div>
      </div>

      {/* Banners Table */}
      {banners.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <Megaphone className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-600">No banners yet.</p>
          <Link href="/admin/banners/new">
            <Button className="mt-4 bg-cyan-700 hover:bg-cyan-600">
              Create your first banner
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
	              {banners.map((banner) => {
	                const colorScheme = banner.color_scheme || "info"
	                const IconComponent = getColorSchemeIcon(colorScheme)
	                const colorStyle = getColorSchemeStyle(colorScheme)

                const isActive =
                  banner.is_active &&
                  (!banner.starts_at || new Date(banner.starts_at) <= now) &&
                  (!banner.ends_at || new Date(banner.ends_at) > now)
                const isScheduled =
                  banner.is_active && banner.starts_at && new Date(banner.starts_at) > now
                const isExpired =
                  banner.is_active && banner.ends_at && new Date(banner.ends_at) <= now

                return (
                  <TableRow key={banner.id} className={!banner.is_active ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="max-w-[250px]">
                        <p className="truncate font-medium text-slate-900">{banner.title}</p>
                        <p className="truncate text-xs text-slate-500">{banner.message}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={colorStyle}>
                        <IconComponent className="mr-1 h-3 w-3" />
                        {colorScheme}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {banner.pages && banner.pages.length > 0 ? (
                          banner.pages.includes("*") ? (
                            <Badge variant="outline" className="text-xs">All pages</Badge>
                          ) : (
                            banner.pages.slice(0, 2).map((page) => (
                              <Badge key={page} variant="outline" className="text-xs">
                                {page}
                              </Badge>
                            ))
                          )
                        ) : (
                          <span className="text-sm text-slate-400">None</span>
                        )}
                        {banner.pages && banner.pages.length > 2 && !banner.pages.includes("*") && (
                          <Badge variant="outline" className="text-xs">
                            +{banner.pages.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {banner.starts_at ? (
                          <p className="text-slate-600">
                            From: {new Date(banner.starts_at).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-slate-400">No start date</p>
                        )}
                        {banner.ends_at ? (
                          <p className="text-slate-600">
                            Until: {new Date(banner.ends_at).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-slate-400">No end date</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {!banner.is_active ? (
                        <Badge variant="outline" className="border-slate-300 text-slate-500">
                          Inactive
                        </Badge>
                      ) : isExpired ? (
                        <Badge variant="outline" className="border-slate-300 text-slate-500">
                          Expired
                        </Badge>
                      ) : isScheduled ? (
                        <Badge className="bg-cyan-100 text-cyan-700">Scheduled</Badge>
                      ) : isActive ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-300 text-amber-700">
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <BannerActions bannerId={banner.id} isActive={banner.is_active ?? false} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
