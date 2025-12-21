"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Share2, Bookmark, Flag, Check, Loader2 } from "lucide-react"
import { reportPost } from "./actions"
import { cn } from "@/lib/utils"

interface PostActionsProps {
  postId: string
  isAuthenticated: boolean
}

export function PostActions({ postId, isAuthenticated }: PostActionsProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const [reported, setReported] = useState(false)

  const handleShare = async () => {
    const url = globalThis.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: url,
        })
      } catch {
        // User cancelled or error - fall back to clipboard
        await copyToClipboard(url)
      }
    } else {
      await copyToClipboard(url)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => { setCopied(false); }, 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.append(textArea)
      textArea.select()
      document.execCommand("copy")
      textArea.remove()
      setCopied(true)
      setTimeout(() => { setCopied(false); }, 2000)
    }
  }

  const handleSave = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(globalThis.location.pathname))
      return
    }
    // TODO: Implement save/bookmark functionality
    alert("Bookmark feature coming soon!")
  }

  const handleReport = async () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(globalThis.location.pathname))
      return
    }

    if (reported) return

    const confirmed = confirm(
      "Are you sure you want to report this post? It will be flagged for moderator review."
    )

    if (!confirmed) return

    setIsReporting(true)
    const result = await reportPost(postId)

    if (result.error) {
      alert(result.error)
    } else {
      setReported(true)
    }

    setIsReporting(false)
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => void handleShare()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-700 transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-green-600">Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            Share
          </>
        )}
      </button>
      <button
        onClick={() => { handleSave(); }}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-cyan-700 transition-colors"
      >
        <Bookmark className="w-4 h-4" />
        Save
      </button>
      <button
        onClick={() => void handleReport()}
        disabled={isReporting || reported}
        className={cn(
          "flex items-center gap-2 text-sm transition-colors",
          reported
            ? "text-amber-600"
            : "text-slate-500 hover:text-slate-600"
        )}
      >
        {isReporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Flag className="w-4 h-4" />
        )}
        {reported ? "Reported" : "Report"}
      </button>
    </div>
  )
}
