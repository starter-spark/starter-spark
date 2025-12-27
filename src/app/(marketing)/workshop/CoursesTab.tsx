import { formatDuration } from '@/lib/utils'
import { BookOpen, Clock, Target, ChevronRight, Lock } from 'lucide-react'
import Link from 'next/link'
import { AnimatedProgressFill } from '@/components/learn/AnimatedProgressFill'
import { LearnFilters } from '../learn/LearnFilters'

interface CourseModule {
  id: string
  title: string
  is_published: boolean | null
  lessons:
    | {
        id: string
        is_optional: boolean | null
        is_published: boolean | null
      }[]
    | null
}

interface Course {
  id: string
  title: string
  description: string | null
  difficulty: string
  duration_minutes: number
  is_published: boolean | null
  product: {
    id: string
    slug: string
    name: string
  } | null
  modules: CourseModule[]
}

interface CoursesTabProps {
  courses: Course[]
  ownedProductIds: string[]
  completedLessonIds: string[]
  learningStats: {
    xp: number
    level: number
    streakDays: number
  }
  isLoggedIn: boolean
  userId?: string
  emptyMessage: string
}

export function CoursesTab({
  courses,
  ownedProductIds,
  completedLessonIds,
  learningStats,
  isLoggedIn,
  userId,
  emptyMessage,
}: CoursesTabProps) {
  return (
    <div>
      {/* Filter Bar */}
      <LearnFilters
        courseCount={courses.length}
        xp={learningStats.xp}
        level={learningStats.level}
        streakDays={learningStats.streakDays}
        isLoggedIn={isLoggedIn}
        userId={userId}
      />

      {/* Course Cards */}
      {courses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {courses.map((course) => {
            const product = course.product
            const isOwned = product
              ? ownedProductIds.includes(product.id)
              : false

            const courseModules = (course.modules ?? []).filter(
              (m) => m.is_published !== false,
            )

            const courseLessons = courseModules.flatMap((mod) =>
              (mod.lessons ?? []).filter((l) => l.is_published !== false),
            )
            const allLessonIds = courseLessons.map((l) => l.id)
            const requiredLessonIds = courseLessons
              .filter((l) => !l.is_optional)
              .map((l) => l.id)
            const totalLessons = allLessonIds.length

            // Calculate completed lessons for this course
            const completedInCourse = requiredLessonIds.filter((id) =>
              completedLessonIds.includes(id),
            ).length
            const progressPercent =
              requiredLessonIds.length > 0
                ? Math.round(
                    (completedInCourse / requiredLessonIds.length) * 100,
                  )
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
                  {isOwned && userId && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-mono text-slate-700">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <AnimatedProgressFill
                          progress={progressPercent}
                          storageKey={`learn:${userId}:course:${course.id}:progress`}
                          className="h-full bg-cyan-700 rounded-full"
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
                            {module.lessons?.length || 0}{' '}
                            {(module.lessons?.length || 0) === 1
                              ? 'lesson'
                              : 'lessons'}
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
                      {isOwned ? 'Continue Learning' : 'View Course'}
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
          <p className="text-slate-600">{emptyMessage}</p>
        </div>
      )}
    </div>
  )
}
