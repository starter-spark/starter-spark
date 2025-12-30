'use client'

import { LessonStatsProvider, LessonStatsBar } from '@/components/learn/LessonStats'

interface LessonStatsWrapperProps {
  lessonId: string
  children: React.ReactNode
}

export function LessonStatsWrapper({ lessonId, children }: LessonStatsWrapperProps) {
  // Key by lessonId to reset stats when lesson changes
  return (
    <LessonStatsProvider key={lessonId} lessonId={lessonId}>
      <div className="mb-6 flex items-center justify-end">
        <LessonStatsBar />
      </div>
      {children}
    </LessonStatsProvider>
  )
}
