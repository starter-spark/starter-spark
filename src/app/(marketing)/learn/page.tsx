import { redirect } from "next/navigation"

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ difficulty?: string }>
}) {
  const { difficulty } = await searchParams

  // Redirect to Workshop with the courses tab
  const params = new URLSearchParams()
  params.set("tab", "courses")
  if (difficulty) {
    params.set("difficulty", difficulty)
  }

  redirect(`/workshop?${params.toString()}`)
}
