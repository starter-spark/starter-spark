import { createClient } from "@/lib/supabase/server"
import { formatDuration } from "@/lib/utils"
import { BookOpen, Clock, Target, ChevronRight, Lock } from "lucide-react"
import Link from "next/link"
import { getContents } from "@/lib/content"

export default async function LearnPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch dynamic content
  const content = await getContents(
    ["learn.header.title", "learn.header.description", "learn.empty"],
    {
      "learn.header.title": "Learn",
      "learn.header.description": "Step-by-step guides to build, wire, and program your robotics kits. Each course breaks complex concepts into manageable lessons.",
      "learn.empty": "No courses available yet. Check back soon.",
    }
  )

  // Fetch all courses with their product info and module/lesson counts
  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      difficulty,
      duration_minutes,
      product:products (
        id,
        slug,
        name
      ),
      modules (
        id,
        title,
        lessons (id)
      )
    `)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching courses:", error)
  }

  // Get user's owned product IDs and completed lessons
  let ownedProductIds: string[] = []
  let completedLessonIds: string[] = []
  if (user) {
    const { data: licenses } = await supabase
      .from("licenses")
      .select("product_id")
      .eq("owner_id", user.id)

    if (licenses) {
      ownedProductIds = licenses.map((l) => l.product_id)
    }

    // Fetch user's completed lessons
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", user.id)

    if (progress) {
      completedLessonIds = progress.map((p) => p.lesson_id)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-mono text-cyan-700 mb-2">Documentation</p>
          <h1 className="font-mono text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            {content["learn.header.title"]}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            {content["learn.header.description"]}
          </p>
        </div>
      </section>

      {/* Course Grid */}
      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          {/* Filter Bar */}
          <div className="flex items-center gap-4 mb-8">
            <span className="text-sm text-slate-500 font-mono">
              {courses?.length || 0} {(courses?.length || 0) === 1 ? "course" : "courses"}{" "}
              available
            </span>
          </div>

          {/* Course Cards */}
          {courses && courses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const product = course.product as unknown as { id: string; slug: string; name: string } | null
                const isOwned = product ? ownedProductIds.includes(product.id) : false

                type CourseModule = {
                  id: string
                  title: string
                  lessons: { id: string }[] | null
                }
                const courseModules = course.modules as unknown as CourseModule[] | null

                // Get all lesson IDs for this course
                const courseLessonIds = courseModules?.flatMap(
                  (mod) => mod.lessons?.map((l) => l.id) || []
                ) || []
                const totalLessons = courseLessonIds.length

                // Calculate completed lessons for this course
                const completedInCourse = courseLessonIds.filter(
                  (id) => completedLessonIds.includes(id)
                ).length
                const progressPercent = totalLessons > 0
                  ? Math.round((completedInCourse / totalLessons) * 100)
                  : 0

                return (
                  <div
                    key={course.id}
                    className="bg-white rounded border border-slate-200 overflow-hidden hover:border-cyan-700 transition-colors"
                  >
                    {/* Course Header */}
                    <div className="p-6 border-b border-slate-100">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded bg-cyan-50 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-cyan-700" />
                        </div>
                        {isOwned ? (
                          <span className="text-xs font-mono bg-green-100 text-green-700 px-2 py-1 rounded">
                            Owned
                          </span>
                        ) : (
                          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        )}
                      </div>
                      <h2 className="font-mono text-xl text-slate-900 mb-2">
                        {course.title}
                      </h2>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {course.description}
                      </p>
                    </div>

                    {/* Course Meta */}
                    <div className="p-6 bg-slate-50/50">
                      <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-slate-500" />
                          <span className="capitalize">{course.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>{formatDuration(course.duration_minutes)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4 text-slate-500" />
                          <span>{totalLessons} lessons</span>
                        </div>
                      </div>

                      {/* Progress Bar (if owned) */}
                      {isOwned && user && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500">Progress</span>
                            <span className="font-mono text-slate-700">{progressPercent}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-700 rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Module List */}
                      {courseModules && courseModules.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {courseModules.map((module) => (
                            <div
                              key={module.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-slate-600">{module.title}</span>
                              <span className="text-slate-500 font-mono text-xs">
                                {module.lessons?.length || 0}{" "}
                                {(module.lessons?.length || 0) === 1 ? "lesson" : "lessons"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* CTA */}
                      {product && (
                        <Link
                          href={`/learn/${product.slug}`}
                          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-sm rounded transition-colors"
                        >
                          {isOwned ? "Continue Learning" : "View Course"}
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-600">
                {content["learn.empty"]}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
