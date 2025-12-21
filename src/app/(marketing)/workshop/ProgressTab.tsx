import { AchievementsPanel } from "./AchievementsPanel"
import { Leaderboard } from "../learn/Leaderboard"
import type { Achievement, UserAchievement } from "@/lib/achievements"
import { Zap, Flame, BookOpen, TrendingUp } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  displayName: string
  xp: number
  level: number
  isCurrentUser: boolean
}

interface ProgressTabProps {
  learningStats: {
    xp: number
    level: number
    streakDays: number
  }
  lessonsCompleted: number
  achievements: Achievement[]
  userAchievements: UserAchievement[]
  totalPoints: number
  leaderboardEntries: LeaderboardEntry[]
  currentUserRank: number | null
  isLoggedIn: boolean
}

export function ProgressTab({
  learningStats,
  lessonsCompleted,
  achievements,
  userAchievements,
  totalPoints,
  leaderboardEntries,
  currentUserRank,
  isLoggedIn,
}: ProgressTabProps) {
  if (!isLoggedIn) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-600 mb-4">Sign in to track your learning progress.</p>
      </div>
    )
  }

  const xpToNextLevel = 1000 - (learningStats.xp % 1000)
  const progressPercent = ((learningStats.xp % 1000) / 1000) * 100

  return (
    <div className="space-y-8">
      {/* Stats Overview - Full Width */}
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-mono text-xl text-slate-900">Your Progress</h3>
          <div className="text-sm text-slate-500">
            <span className="font-mono text-cyan-700">{xpToNextLevel} XP</span> to Level {learningStats.level + 1}
          </div>
        </div>

        {/* Stats Grid - Larger Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-lg border border-cyan-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-cyan-700">Level</span>
            </div>
            <p className="font-mono text-4xl text-cyan-900">{learningStats.level}</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-600">Total XP</span>
            </div>
            <p className="font-mono text-4xl text-slate-900">{learningStats.xp.toLocaleString()}</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-amber-700">Streak</span>
            </div>
            <p className="font-mono text-4xl text-amber-900">
              {learningStats.streakDays}
              <span className="text-lg ml-1">days</span>
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-green-700">Lessons</span>
            </div>
            <p className="font-mono text-4xl text-green-900">{lessonsCompleted}</p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Progress to Level {learningStats.level + 1}</span>
            <span className="font-mono text-slate-700">
              {learningStats.xp % 1000} / 1000 XP
            </span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Two Column Layout for Achievements & Leaderboard */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Achievements - Takes 2/3 width */}
        <div className="lg:col-span-2">
          <AchievementsPanel
            achievements={achievements}
            userAchievements={userAchievements}
            totalPoints={totalPoints}
            title="Achievements"
            hint="Hover over locked achievements to see how to unlock them"
          />
        </div>

        {/* Leaderboard - Takes 1/3 width */}
        <div>
          {leaderboardEntries.length > 0 && (
            <Leaderboard
              entries={leaderboardEntries}
              currentUserRank={currentUserRank}
            />
          )}
        </div>
      </div>
    </div>
  )
}
