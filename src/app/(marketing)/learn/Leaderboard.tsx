'use client'

import { useState } from 'react'
import { Trophy, Medal, Award, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  displayName: string
  xp: number
  level: number
  isCurrentUser: boolean
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserRank?: number | null
}

export function Leaderboard({ entries, currentUserRank }: LeaderboardProps) {
  const [expanded, setExpanded] = useState(false)
  const visibleEntries = expanded ? entries : entries.slice(0, 5)

  if (entries.length === 0) {
    return null
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />
    if (rank === 3) return <Award className="w-5 h-5 text-amber-700" />
    return (
      <span className="w-5 h-5 flex items-center justify-center font-mono text-sm text-slate-500">
        {rank}
      </span>
    )
  }

  return (
    <div className="bg-white rounded border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="font-mono text-sm font-semibold text-slate-900">
            Leaderboard
          </h3>
        </div>
        {currentUserRank && currentUserRank > 10 && (
          <span className="text-xs text-slate-500">
            Your rank: #{currentUserRank}
          </span>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {visibleEntries.map((entry) => (
          <div
            key={entry.rank}
            className={cn(
              'px-4 py-2 flex items-center gap-3',
              entry.isCurrentUser && 'bg-cyan-50',
            )}
          >
            <div className="flex-shrink-0">{getRankIcon(entry.rank)}</div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'font-mono text-sm truncate',
                  entry.isCurrentUser
                    ? 'text-cyan-700 font-medium'
                    : 'text-slate-700',
                )}
              >
                {entry.displayName}
                {entry.isCurrentUser && ' (You)'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono text-slate-500">Lv.{entry.level}</span>
              <span className="font-mono text-amber-600 font-medium">
                {entry.xp} XP
              </span>
            </div>
          </div>
        ))}
      </div>

      {entries.length > 5 && (
        <button
          type="button"
          onClick={() => {
            setExpanded(!expanded)
          }}
          className="w-full px-4 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1 border-t border-slate-100"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show all {entries.length}
            </>
          )}
        </button>
      )}
    </div>
  )
}
