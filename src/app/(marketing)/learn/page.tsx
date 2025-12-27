import { redirect } from 'next/navigation'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

export default async function LearnPage({
  searchParams,
}: {
  searchParams: MaybePromise<{ difficulty?: string }>
}) {
  const { difficulty } = await resolveParams(searchParams)

  // Redirect to Workshop with the courses tab
  const params = new URLSearchParams()
  params.set('tab', 'courses')
  if (difficulty) {
    params.set('difficulty', difficulty)
  }

  redirect(`/workshop?${params.toString()}`)
}
