import { createClient } from '@/lib/supabase/server'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { LessonSidebar } from './LessonSidebar'
import { LessonContent } from '@/components/learn/LessonContent'
import { LessonPrefetch } from './LessonPrefetch'
import { LessonNavigation } from './LessonNavigation'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

export default async function LessonPage({
  params,
}: {
  params: MaybePromise<{ product: string; lesson: string }>
}) {
  const { product: productSlug, lesson: lessonSlug } = await resolveParams(
    params,
  )
  const supabase = await createClient()

  // First fetch the product by slug
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, slug, name')
    .eq('slug', productSlug)
    .maybeSingle()

  if (productError) {
    console.error('Error fetching product:', productError)
    throw new Error('Failed to load product')
  }

  if (!product) {
    notFound()
  }

  // Then fetch the published course structure by product_id
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select(
      `
      id,
      title,
      is_published,
      modules (
        id,
        title,
        sort_order,
        is_published,
        lessons (
          id,
          slug,
          title,
          description,
          lesson_type,
          difficulty,
          duration_minutes,
          sort_order,
          is_optional,
          is_published
        )
      )
    `,
    )
    .eq('product_id', product.id)
    .eq('is_published', true)
    .maybeSingle()

  if (courseError) {
    console.error('Error fetching course structure:', courseError)
    throw new Error('Failed to load course')
  }

  if (!courseData) {
    notFound()
  }

  // Sort modules and lessons
  interface ModuleWithLessons {
    id: string
    title: string
    sort_order: number
    is_published: boolean | null
    lessons:
      | {
          id: string
          slug: string
          title: string
          description: string | null
          lesson_type: string | null
          difficulty: string | null
          duration_minutes: number
          sort_order: number
          is_optional: boolean | null
          is_published: boolean | null
        }[]
      | null
  }
  const modules = courseData.modules as unknown as ModuleWithLessons[] | null
  const sortedModules =
    modules
      ?.filter((m) => m.is_published !== false)
      ?.sort((a, b) => a.sort_order - b.sort_order)
      .map((mod) => ({
        ...mod,
        lessons:
          mod.lessons
            ?.filter((l) => l.is_published !== false)
            .sort((a, b) => a.sort_order - b.sort_order) || [],
      })) || []

  const flatLessons = sortedModules.flatMap((mod) =>
    mod.lessons.map((l) => ({ ...l, moduleId: mod.id })),
  )

  const lesson = flatLessons.find((l) => l.slug === lessonSlug)
  if (!lesson) {
    notFound()
  }

  // Find current lesson index and prev/next
  const currentIndex = flatLessons.findIndex((l) => l.slug === lessonSlug)
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : null
  const nextHref = nextLesson
    ? `/learn/${productSlug}/${nextLesson.slug}`
    : `/learn/${productSlug}`
  const prefetchHrefs =
    nextHref === `/learn/${productSlug}`
      ? [nextHref]
      : [nextHref, `/learn/${productSlug}`]

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(`/learn/${productSlug}/${lessonSlug}`)}`,
    )
  }

  // Check if user owns this product
  let isOwned = false
  if (user) {
    // Use limit(1) instead of single(), multiple licenses possible.
    const { data: licenses } = await supabase
      .from('licenses')
      .select('id')
      .eq('owner_id', user.id)
      .eq('product_id', product.id)
      .limit(1)

    if (licenses && licenses.length > 0) {
      isOwned = true
    }
  }

  // Redirect to course page if not owned
  if (!isOwned) {
    redirect(`/learn/${productSlug}`)
  }

  interface LessonContentData {
    content: string
    content_blocks: unknown
    video_url: string | null
    code_starter: string | null
    code_solution: string | null
  }

  const { data: lessonContentRaw, error: lessonContentError } = await supabase
    .from('lesson_content')
    .select('content, content_blocks, video_url, code_starter, code_solution')
    .eq('lesson_id', lesson.id)
    .maybeSingle()

  if (lessonContentError) {
    console.error('Error fetching lesson content:', lessonContentError)
  }

  const lessonContent = lessonContentRaw as LessonContentData | null

  // Fetch user's lesson progress for this course
  const completedLessonIds = new Set<string>()
  if (user) {
    const courseLessonIds = sortedModules.flatMap((mod) =>
      mod.lessons.map((l) => l.id),
    )
    const lessonIdsForProgress =
      courseLessonIds.length > 0 ? courseLessonIds : [lesson.id]
    const { data: progressData } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .in('lesson_id', lessonIdsForProgress)

    if (progressData) {
      for (const p of progressData) completedLessonIds.add(p.lesson_id)
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

  // Calculate progress based on required (non-optional) lessons
  const requiredLessonIds = sortedModules.flatMap((mod) =>
    mod.lessons.filter((l) => !l.is_optional).map((l) => l.id),
  )
  const totalRequiredLessons = requiredLessonIds.length
  const completedRequiredCount = requiredLessonIds.filter((id) =>
    completedLessonIds.has(id),
  ).length
  const progressPercent =
    totalRequiredLessons > 0
      ? Math.round((completedRequiredCount / totalRequiredLessons) * 100)
      : 0

  const currentLessonMeta = sortedModules
    .flatMap((mod) => mod.lessons)
    .find((l) => l.id === lesson.id)
  const isCurrentOptional = currentLessonMeta?.is_optional === true
  const isCurrentCompleted = completedLessonIds.has(lesson.id)
  const nextCompletedRequiredCount =
    completedRequiredCount + (!isCurrentOptional && !isCurrentCompleted ? 1 : 0)
  const nextProgressPercent =
    totalRequiredLessons > 0
      ? Math.round((nextCompletedRequiredCount / totalRequiredLessons) * 100)
      : progressPercent

  const contentBlocks = Array.isArray(lessonContent?.content_blocks)
    ? (lessonContent?.content_blocks as unknown[])
    : null

  return (
    <div className="bg-slate-50 flex">
      <LessonPrefetch hrefs={prefetchHrefs} />
      {/* Sidebar */}
      <LessonSidebar
        product={productSlug}
        currentLesson={lessonSlug}
        course={sidebarCourse}
        completedLessonIds={completedLessonIds}
        progressPercent={progressPercent}
        progressStorageKey={`learn:${user.id}:course:${courseData.id}:progress`}
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
            <div className="w-5 h-5" aria-hidden="true" />
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
            <Link
              href={`/learn/${productSlug}`}
              className="hover:text-cyan-700"
            >
              {courseData.title}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900">{lesson.title}</span>
          </div>

          {/* Lesson Title */}
          <h1 className="font-mono text-3xl lg:text-4xl font-bold text-slate-900 mb-8">
            {lesson.title}
          </h1>

          {/* Lesson content (from DB) */}
          <LessonContent
            content={lessonContent?.content || ''}
            contentBlocks={contentBlocks}
            lessonType={lesson.lesson_type || 'content'}
            videoUrl={lessonContent?.video_url}
            codeStarter={lessonContent?.code_starter}
            codeSolution={lessonContent?.code_solution}
          />

          {/* Navigation */}
          <LessonNavigation
            prevHref={
              prevLesson ? `/learn/${productSlug}/${prevLesson.slug}` : null
            }
            nextHref={
              nextLesson
                ? `/learn/${productSlug}/${nextLesson.slug}`
                : `/learn/${productSlug}`
            }
            isLastLesson={!nextLesson}
            lessonId={lesson.id}
            progressStorageKey={`learn:${user.id}:course:${courseData.id}:progress`}
            nextProgressPercent={nextProgressPercent}
          />
        </div>
      </div>
    </div>
  )
}
