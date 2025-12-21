"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, Flame } from "lucide-react"
import { LearnProgressSync } from "@/components/learn/LearnProgressSync"

interface LearnFiltersProps {
  courseCount: number
  xp: number
  level: number
  streakDays: number
  isLoggedIn: boolean
  userId?: string
}

export function LearnFilters({
  courseCount,
  xp,
  level,
  streakDays,
  isLoggedIn,
  userId,
}: LearnFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentDifficulty = searchParams.get("difficulty") || "all"

  const handleDifficultyChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("difficulty")
    } else {
      params.set("difficulty", value)
    }
    router.push(`/learn?${params.toString()}`)
  }

  return (
    <>
      {userId && <LearnProgressSync userId={userId} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        {/* Left side - Course count and filter */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 font-mono">
            {courseCount} {courseCount === 1 ? "course" : "courses"} available
          </span>
          <Select value={currentDifficulty} onValueChange={handleDifficultyChange}>
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right side - User stats (if logged in) */}
        {isLoggedIn && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded border border-amber-100">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="font-mono text-amber-700">{xp} XP</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-cyan-50 rounded border border-cyan-100">
                <span className="font-mono text-cyan-700">Lv.{level}</span>
              </div>
              {streakDays > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded border border-orange-100">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-mono text-orange-700">{streakDays}d</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
