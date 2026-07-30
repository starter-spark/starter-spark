'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Home,
  Menu,
  X,
} from 'lucide-react'
import { AnimatedProgressFill } from '@/components/learn/AnimatedProgressFill'
import { LearnProgressSync } from '@/components/learn/LearnProgressSync'

interface LessonSidebarProps {
  product: string
  currentLesson: string
  course: {
    title: string
    modules: {
      title: string
      lessons: { id: string; slug: string; title: string }[]
    }[]
  }
  completedLessonIds: Set<string>
  progressPercent: number
  progressStorageKey: string
}

export function LessonSidebar({
  product,
  currentLesson,
  course,
  completedLessonIds,
  progressPercent,
  progressStorageKey,
}: LessonSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set([0, 1, 2]), // All expanded by default
  )

  const pendingCompletion = useMemo(() => {
    if (globalThis.window === undefined) return null

    try {
      const raw = sessionStorage.getItem(`${progressStorageKey}:pending`)
      if (!raw) return null

      // Legacy: pending stored as a plain number string.
      const legacy = Number(raw)
      if (Number.isFinite(legacy)) {
        return { lessonId: null as string | null, progress: legacy }
      }

      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null) return null
      const record = parsed as Record<string, unknown>

      const lessonId =
        typeof record.lessonId === 'string' && record.lessonId.length > 0
          ? record.lessonId
          : null

      const progress =
        typeof record.progress === 'number' && Number.isFinite(record.progress)
          ? record.progress
          : typeof record.progress === 'string' &&
              Number.isFinite(Number(record.progress))
            ? Number(record.progress)
            : null

      if (progress === null) return null
      return { lessonId, progress }
    } catch {
      return null
    }
  }, [progressStorageKey])

  const displayProgressPercent = useMemo(() => {
    if (globalThis.window === undefined) return progressPercent

    const safeReadNumber = (key: string): number | null => {
      try {
        const raw = sessionStorage.getItem(key)
        if (!raw) return null
        const num = Number(raw)
        return Number.isFinite(num) ? num : null
      } catch {
        return null
      }
    }

    const stored = safeReadNumber(progressStorageKey)
    const pending = pendingCompletion?.progress ?? null

    const clamp = (value: number) => Math.min(100, Math.max(0, value))
    return clamp(Math.max(progressPercent, stored ?? 0, pending ?? 0))
  }, [pendingCompletion?.progress, progressPercent, progressStorageKey])

  const optimisticCompletedLessonIds = useMemo(() => {
    const pendingLessonId = pendingCompletion?.lessonId
    if (!pendingLessonId) return completedLessonIds
    if (completedLessonIds.has(pendingLessonId)) return completedLessonIds

    const next = new Set(completedLessonIds)
    next.add(pendingLessonId)
    return next
  }, [completedLessonIds, pendingCompletion?.lessonId])

  const toggleModule = (index: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // Find current module index
  const currentModuleIndex = course.modules.findIndex((mod) =>
    mod.lessons.some((l) => l.slug === currentLesson),
  )

  // Sidebar content as JSX (not a component to avoid re-render issues)
  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <Link
          href={`/learn/${product}`}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-700 mb-2"
        >
          <Home className="w-4 h-4" />
          <span>Course Overview</span>
        </Link>
        <h2 className="font-mono text-lg text-slate-900 font-bold">
          {course.title}
        </h2>
      </div>

      {/* Progress */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-500">Progress</span>
          <span className="font-mono text-slate-700">
            {displayProgressPercent}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <AnimatedProgressFill
            progress={progressPercent}
            storageKey={progressStorageKey}
            className="h-full bg-cyan-700 rounded-full"
          />
        </div>
      </div>

      {/* Modules */}
      <nav className="flex-1 overflow-y-auto">
        {course.modules.map((courseModule, moduleIndex) => {
          const isExpanded = expandedModules.has(moduleIndex)
          const isCurrentModule = moduleIndex === currentModuleIndex

          return (
            <div key={moduleIndex} className="border-b border-slate-100">
              <button
                onClick={() => {
                  toggleModule(moduleIndex)
                }}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                  isCurrentModule
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'hover:bg-slate-50'
                }`}
              >
                <span className="font-mono text-sm font-medium">
                  {courseModule.title}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {isExpanded && (
                <div className="pb-2">
                  {courseModule.lessons.map((lesson) => {
                    const isCurrent = lesson.slug === currentLesson
                    const isCompleted = optimisticCompletedLessonIds.has(
                      lesson.id,
                    )

                    return (
                      <Link
                        key={lesson.slug}
                        href={`/learn/${product}/${lesson.slug}`}
                        onClick={() => {
                          setMobileOpen(false)
                        }}
                        className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                          isCurrent
                            ? 'bg-cyan-700 text-white'
                            : 'text-slate-600 hover:text-cyan-700 hover:bg-slate-50'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2
                            className={`w-4 h-4 flex-shrink-0 ${
                              isCurrent ? 'text-white' : 'text-green-500'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                              isCurrent
                                ? 'border-white bg-white/20'
                                : 'border-slate-300'
                            }`}
                          />
                        )}
                        <span className="truncate">{lesson.title}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      <LearnProgressSync storageKey={progressStorageKey} />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:left-0 bg-white border-r border-slate-200 pt-16">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => {
          setMobileOpen(true)
        }}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-cyan-700 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => {
              setMobileOpen(false)
            }}
          />
          <aside className="relative w-80 max-w-[85vw] bg-white flex flex-col">
            <button
              onClick={() => {
                setMobileOpen(false)
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
