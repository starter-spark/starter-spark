import { createClient } from '@/lib/supabase/server'
import { formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Award,
  BookOpen,
  Clock,
  Target,
  ChevronRight,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Package,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCourseSchema,
  getBreadcrumbSchema,
  jsonLdScript,
} from '@/lib/structured-data'
import { AnimatedProgressFill } from '@/components/learn/AnimatedProgressFill'
import { headers } from 'next/headers'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

export default async function CoursePage({
  params,
}: {
  params: MaybePromise<{ product: string }>
}) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const { product: productSlug } = await resolveParams(params)
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

  // Then fetch the course by product_id
  const { data: course, error } = await supabase
    .from('courses')
    .select(
      `
      id,
      title,
      description,
      difficulty,
      duration_minutes,
      is_published,
      modules (
        id,
        title,
        description,
        is_published,
        sort_order,
        lessons (
          id,
          slug,
          title,
          description,
          is_published,
          is_optional,
          duration_minutes,
          sort_order
        )
      )
    `,
    )
    .eq('product_id', product.id)
    .eq('is_published', true)
    .maybeSingle()

  if (error) {
    console.error('Error fetching course:', error)
    throw new Error('Failed to load course')
  }

  if (!course) {
    notFound()
  }

  // Sort modules and lessons by sort_order
  interface ModuleWithLessons {
    id: string
    title: string
    description: string | null
    sort_order: number
    is_published: boolean | null
    lessons:
      | {
          id: string
          slug: string
          title: string
          description: string | null
          is_published: boolean | null
          is_optional: boolean
          duration_minutes: number
          sort_order: number
        }[]
      | null
  }
  const modules = course.modules as unknown as ModuleWithLessons[] | null
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user owns this product and fetch lesson progress
  let isOwned = false
  let completedLessonIds: string[] = []
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

      // Fetch completed lessons for this user
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)

      if (progress) {
        completedLessonIds = progress.map((p) => p.lesson_id)
      }
    }
  }

  // Calculate progress based on required (non-optional) lessons
  const allLessons = sortedModules.flatMap((mod) => mod.lessons)
  const requiredLessons = allLessons.filter((l) => !l.is_optional)
  const totalLessons = allLessons.length
  const totalRequiredLessons = requiredLessons.length
  const completedRequiredCount = requiredLessons.filter((l) =>
    completedLessonIds.includes(l.id),
  ).length
  const progressPercent =
    totalRequiredLessons > 0
      ? Math.round((completedRequiredCount / totalRequiredLessons) * 100)
      : 0

  const courseCtaLabel =
    progressPercent >= 100
      ? 'Review Course'
      : progressPercent > 0
        ? 'Continue Course'
        : 'Start Course'

  // Get first incomplete required lesson (optional lessons don't block completion)
  const firstIncompleteLesson = requiredLessons.find(
    (lesson) => !completedLessonIds.includes(lesson.id),
  )
  const firstLesson =
    firstIncompleteLesson || requiredLessons[0] || allLessons[0]

  // Generate structured data for SEO
  const courseSchema = getCourseSchema({
    name: course.title,
    description: course.description || '',
    slug: product.slug,
    difficulty: course.difficulty || undefined,
    duration: formatDuration(course.duration_minutes),
    modules: sortedModules.map((mod) => ({
      name: mod.title,
      description: mod.description || undefined,
    })),
  })

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Learn', url: '/learn' },
    { name: course.title, url: `/learn/${product.slug}` },
  ])

  return (
    <div className="bg-slate-50">
      {/* JSON-LD Structured Data for SEO */}
      <script nonce={nonce} type="application/ld+json">
        {jsonLdScript(courseSchema)}
      </script>
      <script nonce={nonce} type="application/ld+json">
        {jsonLdScript(breadcrumbSchema)}
      </script>
      {/* Header */}
      <section className="pt-32 pb-8 px-6 lg:px-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded bg-cyan-50 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-cyan-700" />
                </div>
                {isOwned && (
                  <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded">
                    Owned
                  </span>
                )}
              </div>
              <h1 className="font-mono text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                {course.title}
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mb-6">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-500" />
                  <span className="capitalize">{course.difficulty}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>{formatDuration(course.duration_minutes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <span>{totalLessons} lessons</span>
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <div className="lg:w-80 bg-slate-50 rounded border border-slate-200 p-6">
              {isOwned ? (
                <>
                  <div className="text-center mb-4">
                    <div className="text-2xl font-mono text-slate-900 mb-1">
                      {progressPercent}%
                    </div>
                    <p className="text-sm text-slate-500">completed</p>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
                    {user && (
                      <AnimatedProgressFill
                        progress={progressPercent}
                        storageKey={`learn:${user.id}:course:${course.id}:progress`}
                        className="h-full bg-cyan-700 rounded-full"
                      />
                    )}
                  </div>
                  {firstLesson && (
                    <Button
                      asChild
                      className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
                    >
                      <Link href={`/learn/${product.slug}/${firstLesson.slug}`}>
                        {courseCtaLabel}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                  {progressPercent >= 100 && (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full mt-3 border-cyan-700 text-cyan-700 hover:bg-cyan-50 font-mono"
                    >
                      <a
                        href={`/api/certificate?courseId=${course.id}`}
                        download
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Download Certificate
                      </a>
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Package className="w-5 h-5 text-slate-500" />
                    <span className="text-sm text-slate-600">
                      Kit required to access lessons
                    </span>
                  </div>
                  <Button
                    asChild
                    className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
                  >
                    <Link href={`/shop/${product.slug}`}>
                      Get the Kit
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <p className="text-xs text-slate-500 text-center mt-3">
                    Already have a kit?{' '}
                    <Link
                      href="/workshop"
                      className="text-cyan-700 hover:underline"
                    >
                      Claim your code
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-12 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-mono text-2xl text-slate-900 mb-8">Curriculum</h2>

          <div className="space-y-6">
            {sortedModules.map((module, moduleIndex) => (
              <div
                key={module.id}
                className="bg-white rounded border border-slate-200 overflow-hidden"
              >
                {/* Module Header */}
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-mono text-lg text-slate-900 mb-1">
                    Module {moduleIndex + 1}: {module.title}
                  </h3>
                  <p className="text-sm text-slate-600">{module.description}</p>
                </div>

                {/* Lessons */}
                <div className="divide-y divide-slate-100">
                  {module.lessons.map((lesson) => {
                    const isAccessible = isOwned
                    const isCompleted = completedLessonIds.includes(lesson.id)

                    return (
                      <div
                        key={lesson.id}
                        className={`flex items-center gap-4 p-4 ${
                          isAccessible
                            ? 'hover:bg-slate-50 cursor-pointer'
                            : 'opacity-60'
                        }`}
                      >
                        {/* Status Icon */}
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : isAccessible ? (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                          ) : (
                            <Lock className="w-5 h-5 text-slate-500" />
                          )}
                        </div>

                        {/* Lesson Info */}
                        <div className="flex-1 min-w-0">
                          {isAccessible ? (
                            <Link
                              href={`/learn/${product.slug}/${lesson.slug}`}
                              className="block"
                            >
                              <h4 className="font-medium text-slate-900 hover:text-cyan-700 transition-colors">
                                {lesson.title}
                              </h4>
                              <p className="text-sm text-slate-500 line-clamp-1">
                                {lesson.description}
                              </p>
                            </Link>
                          ) : (
                            <>
                              <h4 className="font-medium text-slate-900">
                                {lesson.title}
                              </h4>
                              <p className="text-sm text-slate-500 line-clamp-1">
                                {lesson.description}
                              </p>
                            </>
                          )}
                        </div>

                        {/* Duration */}
                        <div className="flex-shrink-0 text-sm text-slate-500 font-mono">
                          {lesson.duration_minutes} min
                        </div>

                        {/* Arrow */}
                        {isAccessible && (
                          <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
