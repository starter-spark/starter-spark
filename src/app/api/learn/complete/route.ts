import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { checkLessonAchievements } from "@/lib/achievements"
import { after } from "next/server"
import { isUuid } from "@/lib/uuid"

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, "default")
  if (limited) return limited

  let lessonId: string | null = null

  try {
    const body: unknown = await request.json()
    if (typeof body === "object" && body !== null) {
      const raw = (body as Record<string, unknown>).lessonId
      if (typeof raw === "string") lessonId = raw
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!lessonId || !isUuid(lessonId)) {
    return NextResponse.json({ error: "Invalid lessonId" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Progress is append-only. A row indicates completion; never overwrite `completed_at`.
  // `ignoreDuplicates` makes this idempotent even if the client retries.
  const { data: upsertedRows, error } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
      },
      { onConflict: "user_id,lesson_id", ignoreDuplicates: true }
    )
    .select("lesson_id")

  if (error) {
    console.error("Error saving lesson progress:", error)
    if (error.code === "23503") {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }
    if (
      error.code === "42501" ||
      error.message.toLowerCase().includes("row-level security")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.json({ error: "Unable to save progress" }, { status: 500 })
  }

  const didInsert = Array.isArray(upsertedRows) && upsertedRows.length > 0
  if (didInsert) {
    after(async () => {
      try {
        await checkLessonAchievements(user.id, lessonId)
      } catch (err) {
        console.error("Error checking lesson achievements:", err)
      }
    })
  }

  return new NextResponse(null, { status: 204 })
}
