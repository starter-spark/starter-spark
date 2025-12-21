/**
 * Achievements System
 * Phase 20.1: Workshop Enhancements
 *
 * Server-side functions for awarding achievements to users.
 * Writes/award checks use the service role client (bypasses RLS).
 * Read helpers for the currently authenticated user should use the regular
 * Supabase client so RLS is enforced.
 */

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import type { Database, Json } from "@/lib/supabase/database.types"

export type AchievementKey =
  | "first_kit"
  | "early_adopter"
  | "first_lesson"
  | "five_lessons"
  | "ten_lessons"
  | "module_complete"
  | "course_complete"
  | "speed_learner"
  | "night_owl"
  | "first_question"
  | "first_answer"
  | "helpful_answer"
  | "five_posts"
  | "first_build"
  | "wiring_pro"
  | "code_ninja"
  | "workshop_attendee"
  | "bug_reporter"
  | "perfectionist"

export interface AwardResult {
  success: boolean
  alreadyEarned?: boolean
  error?: string
}

/**
 * Award an achievement to a user (idempotent - safe to call multiple times)
 */
export async function awardAchievement(
  userId: string,
  achievementKey: AchievementKey,
  metadata?: Json
): Promise<AwardResult> {
  try {
    const { data, error } = await supabaseAdmin.rpc("award_achievement", {
      p_user_id: userId,
      p_achievement_key: achievementKey,
      p_metadata: metadata ?? null,
    })

    if (error) {
      console.error("Error awarding achievement:", error)
      return { success: false, error: error.message }
    }

    if (typeof data !== "boolean") {
      return { success: false, error: "Unexpected response from award_achievement" }
    }

    // data is boolean - true if newly awarded, false if already earned
    return {
      success: true,
      alreadyEarned: !data,
    }
  } catch (err) {
    console.error("Error awarding achievement:", err)
    return { success: false, error: "Failed to award achievement" }
  }
}

interface LessonContext {
  moduleId: string
  courseId: string | null
  courseProductSlug: string | null
}

async function getLessonContext(userId: string, lessonId: string): Promise<LessonContext | null> {
  const { data: lessonContext, error: contextError } = await supabaseAdmin
    .from("lessons")
    .select(
      `
      id,
      module_id,
      module:modules (
        id,
        course_id,
        course:courses (
          id,
          product:products (slug)
        )
      )
    `
    )
    .eq("id", lessonId)
    .maybeSingle()

  if (contextError) {
    console.error("Error fetching lesson context:", contextError)
    return null
  }

  if (!lessonContext) {
    console.warn("Lesson not found while checking achievements", { lessonId, userId })
    return null
  }

  const moduleRow = lessonContext.module as unknown as {
    id: string
    course_id: string
    course: { id: string; product: { slug: string } | null } | null
  } | null

  return {
    moduleId: lessonContext.module_id,
    courseId: moduleRow?.course_id ?? null,
    courseProductSlug: moduleRow?.course?.product?.slug ?? null,
  }
}

async function checkLessonCountAchievements(
  userId: string,
  lessonId: string
): Promise<AwardResult[]> {
  const results: AwardResult[] = []

  const { count: totalCompletedCount, error: totalCountError } = await supabaseAdmin
    .from("lesson_progress")
    .select("lesson_id", { count: "exact", head: true })
    .eq("user_id", userId)

  if (totalCountError) {
    console.error("Error fetching lesson progress count:", totalCountError)
    return results
  }

  const completedCount = totalCompletedCount ?? 0

  if (completedCount >= 1) {
    results.push(
      await awardAchievement(userId, "first_lesson", { lesson_id: lessonId })
    )
  }

  if (completedCount >= 5) {
    results.push(await awardAchievement(userId, "five_lessons"))
  }

  if (completedCount >= 10) {
    results.push(await awardAchievement(userId, "ten_lessons"))
  }

  return results
}

async function checkSpeedLearnerAchievement(userId: string): Promise<AwardResult | null> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: todayCount, error: todayError } = await supabaseAdmin
    .from("lesson_progress")
    .select("lesson_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("completed_at", today.toISOString())

  if (todayError) {
    console.error("Error fetching today's lesson progress:", todayError)
    return null
  }

  return (todayCount ?? 0) >= 3
    ? await awardAchievement(userId, "speed_learner")
    : null
}

async function checkNightOwlAchievement(
  userId: string,
  lessonId: string
): Promise<AwardResult | null> {
  const hour = new Date().getHours()
  if (hour < 5) {
    return awardAchievement(userId, "night_owl", { lesson_id: lessonId })
  }
  return null
}

async function checkModuleCompleteAchievement(
  userId: string,
  moduleId: string
): Promise<AwardResult | null> {
  const { data: moduleLessons, error: moduleLessonsError } = await supabaseAdmin
    .from("lessons")
    .select("id, is_optional")
    .eq("module_id", moduleId)
    .eq("is_published", true)

  if (moduleLessonsError) {
    console.error("Error fetching module lessons:", moduleLessonsError)
    return null
  }

  if (moduleLessons.length === 0) return null

  const moduleLessonIds = moduleLessons
    .filter((lesson) => lesson.is_optional !== true)
    .map((lesson) => lesson.id)

  if (moduleLessonIds.length === 0) return null

  const { count: completedInModule, error: moduleCountError } = await supabaseAdmin
    .from("lesson_progress")
    .select("lesson_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("lesson_id", moduleLessonIds)

  if (moduleCountError) {
    console.error("Error fetching module progress:", moduleCountError)
    return null
  }

  return (completedInModule ?? 0) === moduleLessonIds.length
    ? await awardAchievement(userId, "module_complete", { module_id: moduleId })
    : null
}

async function checkCourseCompleteAchievement(
  userId: string,
  courseId: string,
  courseProductSlug: string | null
): Promise<AwardResult | null> {
  const { data: courseModules, error: courseModulesError } = await supabaseAdmin
    .from("modules")
    .select("id")
    .eq("course_id", courseId)
    .eq("is_published", true)

  if (courseModulesError) {
    console.error("Error fetching course modules:", courseModulesError)
    return null
  }

  const moduleIds = courseModules.map((moduleRow) => moduleRow.id)
  if (moduleIds.length === 0) return null

  const { data: courseLessons, error: courseLessonsError } = await supabaseAdmin
    .from("lessons")
    .select("id, is_optional")
    .in("module_id", moduleIds)
    .eq("is_published", true)

  if (courseLessonsError) {
    console.error("Error fetching course lessons:", courseLessonsError)
    return null
  }

  const allLessonIds = courseLessons
    .filter((lesson) => lesson.is_optional !== true)
    .map((lesson) => lesson.id)

  if (allLessonIds.length === 0) return null

  const { count: completedInCourse, error: courseCountError } = await supabaseAdmin
    .from("lesson_progress")
    .select("lesson_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("lesson_id", allLessonIds)

  if (courseCountError) {
    console.error("Error fetching course progress:", courseCountError)
    return null
  }

  return (completedInCourse ?? 0) === allLessonIds.length
    ? await awardAchievement(userId, "course_complete", {
        course_id: courseId,
        product_slug: courseProductSlug,
      })
    : null
}

/**
 * Check and award lesson-related achievements
 * Call this after a user completes a lesson
 */
export async function checkLessonAchievements(
  userId: string,
  lessonId: string,
): Promise<AwardResult[]> {
  const results: AwardResult[] = []

  const lessonContext = await getLessonContext(userId, lessonId)
  if (!lessonContext) return results

  results.push(...(await checkLessonCountAchievements(userId, lessonId)))

  const speedLearner = await checkSpeedLearnerAchievement(userId)
  if (speedLearner) results.push(speedLearner)

  const nightOwl = await checkNightOwlAchievement(userId, lessonId)
  if (nightOwl) results.push(nightOwl)

  const moduleComplete = await checkModuleCompleteAchievement(userId, lessonContext.moduleId)
  if (moduleComplete) results.push(moduleComplete)

  if (lessonContext.courseId) {
    const courseComplete = await checkCourseCompleteAchievement(
      userId,
      lessonContext.courseId,
      lessonContext.courseProductSlug
    )
    if (courseComplete) results.push(courseComplete)
  }

  return results
}

/**
 * Award first kit achievement when user claims a kit
 */
export async function checkKitClaimAchievements(userId: string): Promise<AwardResult[]> {
  const results: AwardResult[] = []

  // Check if this is the user's first kit
  const { data: licenses } = await supabaseAdmin
    .from("licenses")
    .select("id")
    .eq("owner_id", userId)

  if (licenses?.length === 1) {
    results.push(await awardAchievement(userId, "first_kit"))
  }

  // Check for early adopter (first month of launch)
  // You can adjust this date to your actual launch date
  const launchDate = new Date("2025-01-01")
  const oneMonthAfterLaunch = new Date(launchDate)
  oneMonthAfterLaunch.setMonth(oneMonthAfterLaunch.getMonth() + 1)

  if (new Date() <= oneMonthAfterLaunch) {
    results.push(await awardAchievement(userId, "early_adopter"))
  }

  return results
}

/**
 * Check and award community achievements
 * Call this after a user creates a post or has their answer verified
 */
export async function checkCommunityAchievements(
  userId: string,
  action: "post" | "answer" | "verified_answer"
): Promise<AwardResult[]> {
  const results: AwardResult[] = []

  if (action === "post") {
    // Get user's post count
    const { data: posts } = await supabaseAdmin
      .from("posts")
      .select("id")
      .eq("author_id", userId)

    const postCount = posts?.length || 0

    // First question
    if (postCount === 1) {
      results.push(await awardAchievement(userId, "first_question"))
    }

    // Five posts
    if (postCount === 5) {
      results.push(await awardAchievement(userId, "five_posts"))
    }
  }

  if (action === "answer") {
    // Get user's answer count (comments on posts)
    const { data: answers } = await supabaseAdmin
      .from("comments")
      .select("id")
      .eq("author_id", userId)

    if (answers?.length === 1) {
      results.push(await awardAchievement(userId, "first_answer"))
    }
  }

  if (action === "verified_answer") {
    results.push(await awardAchievement(userId, "helpful_answer"))
  }

  return results
}

export interface Achievement {
  id: string
  key: string
  name: string
  description: string
  icon: string
  points: number
  category: string
  is_secret: boolean
  sort_order: number
  unlock_hint: string | null
}

export interface UserAchievement {
  achievement_id: string
  earned_at: string
  metadata: Json | null
}

export interface UserAchievementsResult {
  achievements: Achievement[]
  userAchievements: UserAchievement[]
  totalPoints: number
}

type AchievementRow = Database["public"]["Tables"]["achievements"]["Row"]
type UserAchievementRow = Database["public"]["Tables"]["user_achievements"]["Row"]

/**
 * Get all achievements with user's earned status
 */
export async function getUserAchievements(userId: string): Promise<UserAchievementsResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error("Error fetching user session:", userError)
  }

  // Get all achievements
  const { data: achievementsData, error: achievementsError } = await supabase
    .from("achievements")
    .select("id, key, name, description, icon, points, category, is_secret, sort_order, unlock_hint")
    .order("sort_order")

  if (achievementsError) {
    console.error("Error fetching achievements:", achievementsError)
    return { achievements: [], userAchievements: [], totalPoints: 0 }
  }

  // Map to proper types
  const achievementsRows = achievementsData as AchievementRow[]
  const achievements: Achievement[] = achievementsRows.map((a) => ({
    id: a.id,
    key: a.key,
    name: a.name,
    description: a.description,
    icon: a.icon,
    points: a.points ?? 0,
    category: a.category ?? "general",
    is_secret: a.is_secret ?? false,
    sort_order: a.sort_order ?? 0,
    unlock_hint: a.unlock_hint ?? null,
  }))

  if (!user) {
    return { achievements, userAchievements: [], totalPoints: 0 }
  }

  if (user.id !== userId) {
    console.warn("Refusing to fetch achievements for a different user", {
      requestedUserId: userId,
      sessionUserId: user.id,
    })
    return { achievements, userAchievements: [], totalPoints: 0 }
  }

  // Get user's earned achievements (RLS enforces auth.uid() == user_id)
  const { data: userAchievementsData, error: userAchievementsError } = await supabase
    .from("user_achievements")
    .select("achievement_id, earned_at, metadata")
    .eq("user_id", userId)

  if (userAchievementsError) {
    console.error("Error fetching user achievements:", userAchievementsError)
    return { achievements, userAchievements: [], totalPoints: 0 }
  }

  // Map to proper types
  const userAchievementRows = userAchievementsData as UserAchievementRow[]
  const userAchievements: UserAchievement[] = userAchievementRows.map((ua) => ({
    achievement_id: ua.achievement_id,
    earned_at: ua.earned_at ?? new Date().toISOString(),
    metadata: ua.metadata,
  }))

  // Calculate total points
  const earnedIds = new Set(userAchievements.map((ua) => ua.achievement_id))
  const totalPoints = achievements
    .filter((a) => earnedIds.has(a.id))
    .reduce((sum, a) => sum + a.points, 0)

  return {
    achievements,
    userAchievements,
    totalPoints,
  }
}
