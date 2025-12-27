import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ContentEditor } from './ContentEditor'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

type PageParams = MaybePromise<{ pageKey: string }>

export default async function EditContentPage({
  params,
}: {
  params: PageParams
}) {
  const { pageKey } = await resolveParams(params)
  const supabase = await createClient()

  // Fetch page content
  const { data: page, error } = await supabase
    .from('page_content')
    .select('*')
    .eq('page_key', pageKey)
    .maybeSingle()

  if (error) {
    console.error('Error fetching page content:', error)
    throw new Error('Failed to load page content')
  }

  if (!page) notFound()

  return (
    <div className="space-y-6">
      <ContentEditor page={page} />
    </div>
  )
}
