import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { BannerForm } from "../BannerForm"

export const metadata = {
  title: "Create Banner | Admin",
}

export default function NewBannerPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/banners"
          className="inline-flex items-center text-sm text-slate-600 hover:text-cyan-700 mb-4"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Banners
        </Link>
        <h1 className="font-mono text-2xl font-bold text-slate-900">Create Banner</h1>
        <p className="text-slate-600">Add a new site-wide announcement or promotion</p>
      </div>

      <BannerForm />
    </div>
  )
}
