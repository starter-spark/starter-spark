"use client"

import { Award, Lock, Star, BookOpen, Users, Hammer, HelpCircle, Zap, Moon } from "lucide-react"
import { useState } from "react"
import type { Achievement, UserAchievement } from "@/lib/achievements"

// Map of icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Award,
  Star,
  BookOpen,
  Users,
  Hammer,
  HelpCircle,
  Zap,
  Moon,
  Package: Award, // fallback
  BookMarked: BookOpen,
  Library: BookOpen,
  GraduationCap: Award,
  MessageCircle: Users,
  ThumbsUp: Award,
  Cable: Hammer,
  Code: Hammer,
  CalendarCheck: Star,
  Bug: Star,
  CheckCircle: Award,
}

interface AchievementsPanelProps {
  achievements: Achievement[]
  userAchievements: UserAchievement[]
  totalPoints: number
  title?: string
  hint?: string
}

export function AchievementsPanel({
  achievements,
  userAchievements,
  totalPoints,
  title = "Achievements",
  hint = "Complete lessons to unlock badges",
}: AchievementsPanelProps) {
  const [showAll, setShowAll] = useState(false)

  const earnedIds = new Set(userAchievements.map((ua) => ua.achievement_id))

  // Filter achievements: show earned ones, non-secret unearned ones
  // Secret unearned ones show as "???"
  const visibleAchievements = achievements.filter((a) => {
    if (earnedIds.has(a.id)) return true
    if (!a.is_secret) return true
    return false // Hide unearned secret achievements
  })

  // Sort: earned first, then by sort_order
  const sortedAchievements = [...visibleAchievements].sort((a, b) => {
    const aEarned = earnedIds.has(a.id)
    const bEarned = earnedIds.has(b.id)
    if (aEarned && !bEarned) return -1
    if (!aEarned && bEarned) return 1
    return 0
  })

  // Show only first 8 unless expanded
  const displayedAchievements = showAll
    ? sortedAchievements
    : sortedAchievements.slice(0, 8)

  const earnedCount = userAchievements.length
  const totalCount = achievements.filter((a) => !a.is_secret).length

  return (
    <div className="bg-white rounded border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="font-mono text-lg text-slate-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-amber-600">{totalPoints} pts</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">
            {earnedCount}/{totalCount}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {displayedAchievements.map((achievement) => {
          const isEarned = earnedIds.has(achievement.id)
          const IconComponent = iconMap[achievement.icon] || Award

          return (
            <div
              key={achievement.id}
              className={`group relative aspect-square rounded border flex items-center justify-center cursor-pointer transition-all ${
                isEarned
                  ? "border-amber-300 bg-amber-50 hover:border-amber-400 hover:bg-amber-100"
                  : "border-slate-200 bg-slate-50 opacity-40 hover:opacity-60"
              }`}
              title={isEarned ? `${achievement.name}: ${achievement.description}` : achievement.name}
            >
              {isEarned ? (
                <IconComponent className="w-6 h-6 text-amber-500" />
              ) : (
                <Lock className="w-5 h-5 text-slate-400" />
              )}

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-[200px]">
                <div className="font-medium">{achievement.name}</div>
                {isEarned ? (
                  <div className="text-amber-400">+{achievement.points} pts</div>
                ) : (
                  achievement.unlock_hint && (
                    <div className="text-slate-400 text-[10px] mt-0.5 whitespace-normal">{achievement.unlock_hint}</div>
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>

      {sortedAchievements.length > 8 && (
        <button
          onClick={() => { setShowAll(!showAll); }}
          className="w-full mt-3 text-xs text-cyan-700 hover:text-cyan-800 font-mono"
        >
          {showAll ? "Show Less" : `View All (${sortedAchievements.length})`}
        </button>
      )}

      <p className="text-xs text-slate-500 mt-3 text-center">{hint}</p>
    </div>
  )
}
