import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Home,
  Menu,
} from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { LessonSidebar } from "./LessonSidebar"
import { LessonContent } from "./LessonContent"

export default async function LessonPage({
  params,
}: {
  params: Promise<{ product: string; lesson: string }>
}) {
  const { product: productSlug, lesson: lessonSlug } = await params
  const supabase = await createClient()

  // Fetch the lesson with its module and course info
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select(`
      id,
      slug,
      title,
      description,
      content,
      duration_minutes,
      sort_order,
      module:modules (
        id,
        title,
        sort_order,
        course:courses (
          id,
          title,
          product:products (
            id,
            slug,
            name
          )
        )
      )
    `)
    .eq("slug", lessonSlug)
    .single()

  if (lessonError || !lesson) {
    notFound()
  }

  const lessonModule = lesson.module as unknown as {
    id: string
    title: string
    sort_order: number
    course: {
      id: string
      title: string
      product: { id: string; slug: string; name: string } | null
    } | null
  } | null

  const course = lessonModule?.course
  const product = course?.product

  if (!product || product.slug !== productSlug) {
    notFound()
  }

  // Fetch full course structure for sidebar
  const { data: courseData } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      modules (
        id,
        title,
        sort_order,
        lessons (
          id,
          slug,
          title,
          sort_order
        )
      )
    `)
    .eq("id", course.id)
    .single()

  if (!courseData) {
    notFound()
  }

  // Sort modules and lessons
  type ModuleWithLessons = {
    id: string
    title: string
    sort_order: number
    lessons: { id: string; slug: string; title: string; sort_order: number }[] | null
  }
  const modules = courseData.modules as unknown as ModuleWithLessons[] | null
  const sortedModules = modules
    ?.sort((a, b) => a.sort_order - b.sort_order)
    .map((mod) => ({
      ...mod,
      lessons: mod.lessons?.sort((a, b) => a.sort_order - b.sort_order) || [],
    })) || []

  // Build flat list of all lessons for navigation
  const allLessons: { slug: string; title: string; moduleId: string }[] = []
  sortedModules.forEach((mod) => {
    mod.lessons.forEach((l) => {
      allLessons.push({ slug: l.slug, title: l.title, moduleId: mod.id })
    })
  })

  // Find current lesson index and prev/next
  const currentIndex = allLessons.findIndex((l) => l.slug === lessonSlug)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user owns this product
  let isOwned = false
  if (user) {
    const { data: license } = await supabase
      .from("licenses")
      .select("id")
      .eq("owner_id", user.id)
      .eq("product_id", product.id)
      .single()

    if (license) {
      isOwned = true
    }
  }

  // Redirect to course page if not owned
  if (!isOwned) {
    redirect(`/learn/${productSlug}`)
  }

  // Fetch user's lesson progress for this course
  const completedLessonIds: Set<string> = new Set()
  if (user) {
    const allLessonIds = sortedModules.flatMap((mod) => mod.lessons.map((l) => l.id))
    const { data: progressData } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", user.id)
      .eq("completed", true)
      .in("lesson_id", allLessonIds)

    if (progressData) {
      progressData.forEach((p) => completedLessonIds.add(p.lesson_id))
    }
  }

  // Build sidebar course structure with IDs for progress tracking
  const sidebarCourse = {
    title: courseData.title,
    modules: sortedModules.map((mod) => ({
      title: mod.title,
      lessons: mod.lessons.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
      })),
    })),
  }

  // Calculate progress
  const totalLessons = sortedModules.reduce((acc, mod) => acc + mod.lessons.length, 0)
  const completedCount = completedLessonIds.size
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <LessonSidebar
        product={productSlug}
        currentLesson={lessonSlug}
        course={sidebarCourse}
        completedLessonIds={completedLessonIds}
        progressPercent={progressPercent}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-72">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href={`/learn/${productSlug}`}
              className="text-sm text-slate-500 hover:text-cyan-700"
            >
              <Home className="w-5 h-5" />
            </Link>
            <span className="font-mono text-sm text-slate-900">
              {lesson.title}
            </span>
            <button className="text-slate-500">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500 mb-8">
            <Link href="/learn" className="hover:text-cyan-700">
              Learn
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/learn/${productSlug}`} className="hover:text-cyan-700">
              {courseData.title}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900">{lesson.title}</span>
          </div>

          {/* Lesson Title */}
          <h1 className="font-mono text-3xl lg:text-4xl font-bold text-slate-900 mb-8">
            {lesson.title}
          </h1>

          {/* Lesson Content - renders markdown/HTML from database */}
          <LessonContent content={lesson.content} />

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-200">
            {prevLesson ? (
              <Link
                href={`/learn/${productSlug}/${prevLesson.slug}`}
                className="flex items-center gap-2 text-slate-600 hover:text-cyan-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Link>
            ) : (
              <div />
            )}

            {nextLesson ? (
              <Link href={`/learn/${productSlug}/${nextLesson.slug}`}>
                <Button className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono">
                  Next Lesson
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link href={`/learn/${productSlug}`}>
                <Button className="bg-green-600 hover:bg-green-500 text-white font-mono">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete Course
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
