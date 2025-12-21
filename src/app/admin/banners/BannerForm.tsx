"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Info, AlertTriangle, CheckCircle, XCircle, Tag, Zap, Gift, Megaphone, X, Loader2 } from "lucide-react"
import { createBanner, updateBanner } from "./actions"

interface BannerFormProps {
  banner?: {
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
    sort_order: number | null
  }
}

const COLOR_SCHEMES = [
  // Status banners
  { value: "info", label: "Info", icon: Info, preview: "bg-cyan-50 text-cyan-800 border-cyan-200", category: "Status" },
  { value: "warning", label: "Warning", icon: AlertTriangle, preview: "bg-amber-50 text-amber-800 border-amber-200", category: "Status" },
  { value: "success", label: "Success", icon: CheckCircle, preview: "bg-green-50 text-green-800 border-green-200", category: "Status" },
  { value: "error", label: "Error", icon: XCircle, preview: "bg-red-50 text-red-800 border-red-200", category: "Status" },
  // Promotional banners
  { value: "sale", label: "Sale", icon: Tag, preview: "bg-rose-600 text-white border-rose-700", category: "Promo" },
  { value: "promo", label: "Promo", icon: Zap, preview: "bg-violet-600 text-white border-violet-700", category: "Promo" },
  { value: "announcement", label: "Announcement", icon: Megaphone, preview: "bg-slate-800 text-white border-slate-900", category: "Promo" },
  { value: "gift", label: "Gift/Giveaway", icon: Gift, preview: "bg-emerald-600 text-white border-emerald-700", category: "Promo" },
]

const PAGE_OPTIONS = [
  { value: "*", label: "All Pages" },
  { value: "/", label: "Homepage" },
  { value: "/shop", label: "Shop" },
  { value: "/workshop", label: "Workshop" },
  { value: "/learn", label: "Learn" },
  { value: "/community", label: "Community" },
  { value: "/events", label: "Events" },
  { value: "/cart", label: "Cart" },
]

export function BannerForm({ banner }: BannerFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [colorScheme, setColorScheme] = useState(banner?.color_scheme || "info")
  const [selectedPages, setSelectedPages] = useState<string[]>(banner?.pages || ["*"])
  const [isDismissible, setIsDismissible] = useState(banner?.is_dismissible ?? true)
  const [isActive, setIsActive] = useState(banner?.is_active ?? true)

  const selectedScheme = COLOR_SCHEMES.find((s) => s.value === colorScheme) || COLOR_SCHEMES[0]
  const IconComponent = selectedScheme.icon

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)

      // Add multi-select pages
      for (const page of selectedPages) { formData.append("pages", page); }

      // Add boolean fields
      formData.set("is_dismissible", isDismissible.toString())
      formData.set("is_active", isActive.toString())

      await (banner?.id ? updateBanner(banner.id, formData) : createBanner(formData));

      router.push("/admin/banners")
      router.refresh()
    } catch (error) {
      console.error("Failed to save banner:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePage = (page: string) => {
    if (page === "*") {
      // If selecting "All Pages", clear other selections
      setSelectedPages(["*"])
    } else {
      // Remove "All Pages" if selecting specific pages
      setSelectedPages((prev) => {
        const withoutAll = prev.filter((p) => p !== "*")
        if (withoutAll.includes(page)) {
          return withoutAll.filter((p) => p !== page)
        }
        return [...withoutAll, page]
      })
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Banner Content</CardTitle>
            <CardDescription>The message and appearance of your banner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title (Admin Reference)</Label>
              <Input
                id="title"
                name="title"
                defaultValue={banner?.title || ""}
                placeholder="e.g., Holiday Sale Banner"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                defaultValue={banner?.message || ""}
                placeholder="The message to display in the banner"
                rows={3}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="link_url">Link URL (Optional)</Label>
                <Input
                  id="link_url"
                  name="link_url"
                  type="url"
                  defaultValue={banner?.link_url || ""}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link_text">Link Text (Optional)</Label>
                <Input
                  id="link_text"
                  name="link_text"
                  defaultValue={banner?.link_text || ""}
                  placeholder="Learn more"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color Scheme</Label>
              <Select value={colorScheme} onValueChange={setColorScheme} name="color_scheme">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_SCHEMES.map((scheme) => (
                    <SelectItem key={scheme.value} value={scheme.value}>
                      <div className="flex items-center gap-2">
                        <scheme.icon className="h-4 w-4" />
                        {scheme.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className={`rounded border p-3 ${selectedScheme.preview}`}>
                <div className="flex items-center justify-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm font-medium">Your banner message will appear here</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>Where and when to show this banner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Show on Pages</Label>
                <div className="flex flex-wrap gap-2">
                  {PAGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => { togglePage(option.value); }}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors ${
                        selectedPages.includes(option.value)
                          ? "bg-cyan-100 text-cyan-700"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {option.label}
                      {selectedPages.includes(option.value) && (
                        <X className="h-3 w-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Start Date (Optional)</Label>
                  <Input
                    id="starts_at"
                    name="starts_at"
                    type="datetime-local"
                    defaultValue={
                      banner?.starts_at
                        ? new Date(banner.starts_at).toISOString().slice(0, 16)
                        : ""
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ends_at">End Date (Optional)</Label>
                  <Input
                    id="ends_at"
                    name="ends_at"
                    type="datetime-local"
                    defaultValue={
                      banner?.ends_at
                        ? new Date(banner.ends_at).toISOString().slice(0, 16)
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  defaultValue={banner?.sort_order ?? 0}
                  min={0}
                />
                <p className="text-xs text-slate-500">
                  Lower numbers appear first. Banners with the same order sort by creation date.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Behavior</CardTitle>
              <CardDescription>How users interact with this banner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_dismissible">Dismissible</Label>
                  <p className="text-xs text-slate-500">Users can close the banner</p>
                </div>
                <Switch
                  id="is_dismissible"
                  checked={isDismissible}
                  onCheckedChange={setIsDismissible}
                />
              </div>

              {isDismissible && (
                <div className="space-y-2">
                  <Label htmlFor="dismiss_duration_hours">Re-show After (Hours)</Label>
                  <Input
                    id="dismiss_duration_hours"
                    name="dismiss_duration_hours"
                    type="number"
                    defaultValue={banner?.dismiss_duration_hours ?? ""}
                    placeholder="Leave empty for permanent dismiss"
                    min={1}
                  />
                  <p className="text-xs text-slate-500">
                    How long until the banner reappears after being dismissed. Leave empty to never
                    show again.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <Label htmlFor="is_active">Active</Label>
                  <p className="text-xs text-slate-500">Banner is visible to users</p>
                </div>
                <Switch id="is_active" checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => { router.push("/admin/banners"); }}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" className="bg-cyan-700 hover:bg-cyan-600" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : banner?.id ? (
            "Update Banner"
          ) : (
            "Create Banner"
          )}
        </Button>
      </div>
    </form>
  )
}
