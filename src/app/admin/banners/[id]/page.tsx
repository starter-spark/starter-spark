import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BannerForm } from '../BannerForm'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

export const metadata = {
  title: 'Edit Banner | Admin',
}

async function getBanner(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('site_banners')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching banner:', error)
    throw new Error('Failed to load banner')
  }

  return data
}

export default async function EditBannerPage({
  params,
}: {
  params: MaybePromise<{ id: string }>
}) {
  const { id } = await resolveParams(params)
  const banner = await getBanner(id)

  if (!banner) {
    notFound()
  }

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
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          Edit Banner
        </h1>
        <p className="text-slate-600">{banner.title}</p>
      </div>

      <BannerForm banner={banner} />
    </div>
  )
}
