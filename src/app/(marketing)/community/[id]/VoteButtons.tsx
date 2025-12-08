"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react"
import { voteOnPost, voteOnComment } from "./actions"
import { cn } from "@/lib/utils"

interface VoteButtonsProps {
  type: "post" | "comment"
  id: string
  initialVotes: number
  userVote?: 1 | -1 | null
  isAuthenticated: boolean
  size?: "default" | "small"
}

export function VoteButtons({
  type,
  id,
  initialVotes,
  userVote,
  isAuthenticated,
  size = "default",
}: VoteButtonsProps) {
  const router = useRouter()
  const [votes, setVotes] = useState(initialVotes)
  const [currentVote, setCurrentVote] = useState<1 | -1 | null>(userVote ?? null)
  const [isLoading, setIsLoading] = useState(false)

  const handleVote = async (voteType: 1 | -1) => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname))
      return
    }

    setIsLoading(true)

    // Optimistic update
    const previousVote = currentVote
    const previousVotes = votes

    if (currentVote === voteType) {
      // Removing vote
      setCurrentVote(null)
      setVotes(votes - voteType)
    } else if (currentVote) {
      // Changing vote
      setCurrentVote(voteType)
      setVotes(votes + voteType * 2)
    } else {
      // New vote
      setCurrentVote(voteType)
      setVotes(votes + voteType)
    }

    const action = type === "post" ? voteOnPost : voteOnComment
    const result = await action(id, voteType)

    if (result.error) {
      // Revert on error
      setCurrentVote(previousVote)
      setVotes(previousVotes)

      if (result.requiresAuth) {
        router.push("/login?redirect=" + encodeURIComponent(window.location.pathname))
      }
    }

    setIsLoading(false)
  }

  const iconSize = size === "small" ? "w-5 h-5" : "w-6 h-6"
  const textSize = size === "small" ? "text-sm" : "text-lg"

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={isLoading}
        className={cn(
          "p-1 transition-colors",
          currentVote === 1
            ? "text-cyan-700"
            : "text-slate-500 hover:text-cyan-700"
        )}
        aria-label="Upvote"
      >
        {isLoading ? (
          <Loader2 className={cn(iconSize, "animate-spin")} />
        ) : (
          <ChevronUp className={iconSize} />
        )}
      </button>
      <span className={cn("font-mono text-slate-700", textSize)}>{votes}</span>
      <button
        onClick={() => handleVote(-1)}
        disabled={isLoading}
        className={cn(
          "p-1 transition-colors",
          currentVote === -1
            ? "text-red-500"
            : "text-slate-500 hover:text-slate-600"
        )}
        aria-label="Downvote"
      >
        <ChevronDown className={iconSize} />
      </button>
    </div>
  )
}
