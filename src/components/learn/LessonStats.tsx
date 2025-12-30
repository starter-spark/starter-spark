'use client'

import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { Clock, RotateCcw, Target, Trophy } from 'lucide-react'

// Context for sharing stats across lesson components
interface LessonStatsContextType {
  timeSpent: number // seconds
  codeAttempts: number
  quizScore: { correct: number; total: number }
  incrementAttempts: () => void
  recordQuizAnswer: (isCorrect: boolean) => void
}

const LessonStatsContext = createContext<LessonStatsContextType | null>(null)

export function useLessonStats() {
  const context = useContext(LessonStatsContext)
  if (!context) {
    throw new Error('useLessonStats must be used within LessonStatsProvider')
  }
  return context
}

// Optional hook that doesn't throw if context is missing
export function useLessonStatsOptional() {
  return useContext(LessonStatsContext)
}

interface LessonStatsProviderProps {
  lessonId: string
  children: React.ReactNode
}

export function LessonStatsProvider({ children }: LessonStatsProviderProps) {
  const [timeSpent, setTimeSpent] = useState(0)
  const [codeAttempts, setCodeAttempts] = useState(0)
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 })

  // Track time spent (reset is handled by key-based remount in parent)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const incrementAttempts = useCallback(() => {
    setCodeAttempts((prev) => prev + 1)
  }, [])

  const recordQuizAnswer = useCallback((isCorrect: boolean) => {
    setQuizScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }))
  }, [])

  return (
    <LessonStatsContext.Provider
      value={{
        timeSpent,
        codeAttempts,
        quizScore,
        incrementAttempts,
        recordQuizAnswer,
      }}
    >
      {children}
    </LessonStatsContext.Provider>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins}m`
}

export function LessonStatsBar() {
  const stats = useLessonStatsOptional()

  if (!stats) return null

  const { timeSpent, codeAttempts, quizScore } = stats
  const hasQuizzes = quizScore.total > 0

  return (
    <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
      {/* Time spent */}
      <div className="flex items-center gap-1.5" title="Time spent on this lesson">
        <Clock className="w-3.5 h-3.5" />
        <span>{formatDuration(timeSpent)}</span>
      </div>

      {/* Code attempts */}
      {codeAttempts > 0 && (
        <div className="flex items-center gap-1.5" title="Code challenge attempts">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{codeAttempts} {codeAttempts === 1 ? 'attempt' : 'attempts'}</span>
        </div>
      )}

      {/* Quiz score */}
      {hasQuizzes && (
        <div className="flex items-center gap-1.5" title="Quiz score">
          <Target className="w-3.5 h-3.5" />
          <span>{quizScore.correct}/{quizScore.total} correct</span>
        </div>
      )}
    </div>
  )
}

// Floating stats widget for larger display
export function LessonStatsWidget({ className }: { className?: string }) {
  const stats = useLessonStatsOptional()

  if (!stats) return null

  const { timeSpent, codeAttempts, quizScore } = stats
  const hasQuizzes = quizScore.total > 0
  const quizPercentage = hasQuizzes
    ? Math.round((quizScore.correct / quizScore.total) * 100)
    : 0

  return (
    <div className={`bg-white rounded border border-slate-200 p-4 ${className || ''}`}>
      <p className="font-mono text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
        <Trophy className="w-4 h-4 text-amber-500" />
        Session Stats
      </p>

      <div className="space-y-3">
        {/* Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            <span>Time Spent</span>
          </div>
          <span className="font-mono text-sm text-slate-900">
            {formatDuration(timeSpent)}
          </span>
        </div>

        {/* Attempts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <RotateCcw className="w-4 h-4" />
            <span>Code Attempts</span>
          </div>
          <span className="font-mono text-sm text-slate-900">{codeAttempts}</span>
        </div>

        {/* Quiz Score */}
        {hasQuizzes && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Target className="w-4 h-4" />
              <span>Quiz Score</span>
            </div>
            <span className={`font-mono text-sm ${quizPercentage >= 70 ? 'text-green-600' : quizPercentage >= 50 ? 'text-amber-600' : 'text-slate-900'}`}>
              {quizScore.correct}/{quizScore.total} ({quizPercentage}%)
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
