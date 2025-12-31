'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Share2, Bookmark, Flag, Check, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { reportPost, togglePostBookmark } from './actions'
import { cn } from '@/lib/utils'

interface PostActionsProps {
  postId: string
  isAuthenticated: boolean
  initialBookmarked?: boolean
}

export function PostActions({
  postId,
  isAuthenticated,
  initialBookmarked = false,
}: PostActionsProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [isReporting, setIsReporting] = useState(false)
  const [reported, setReported] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)

  const handleShare = async () => {
    const url = globalThis.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: url,
        })
      } catch {
        // User cancelled or errored, fall back to clipboard.
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
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.append(textArea)
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  const handleSave = () => {
    if (!isAuthenticated) {
      router.push(
        '/login?redirect=' + encodeURIComponent(globalThis.location.pathname),
      )
      return
    }

    if (isSaving) return

    setIsSaving(true)
    void (async () => {
      const result = await togglePostBookmark(postId)

      if (result.error) {
        if (result.requiresAuth) {
          router.push(
            '/login?redirect=' + encodeURIComponent(globalThis.location.pathname),
          )
          return
        }
        toast.error('Failed to save post', { description: result.error })
        return
      }

      const next = Boolean((result as { bookmarked?: boolean }).bookmarked)
      setBookmarked(next)
      toast.success(next ? 'Saved' : 'Removed from saved')
    })()
      .catch((err: unknown) => {
        console.error('Bookmark action failed:', err)
        toast.error('Failed to save post')
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  const handleReportClick = () => {
    if (!isAuthenticated) {
      router.push(
        '/login?redirect=' + encodeURIComponent(globalThis.location.pathname),
      )
      return
    }

    if (reported) return

    setShowReportDialog(true)
  }

  const handleReportConfirm = async () => {
    setShowReportDialog(false)
    setIsReporting(true)
    const result = await reportPost(postId)

    if (result.error) {
      toast.error('Failed to report post', { description: result.error })
    } else {
      setReported(true)
      toast.success('Post reported for review')
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
        onClick={() => {
          handleSave()
        }}
        disabled={isSaving}
        className={cn(
          'flex items-center gap-2 text-sm transition-colors disabled:opacity-60',
          bookmarked ? 'text-cyan-700 hover:text-cyan-800' : 'text-slate-500 hover:text-cyan-700',
        )}
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Bookmark className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} />
        )}
        {bookmarked ? 'Saved' : 'Save'}
      </button>
      <button
        onClick={handleReportClick}
        disabled={isReporting || reported}
        className={cn(
          'flex items-center gap-2 text-sm transition-colors',
          reported ? 'text-amber-600' : 'text-slate-500 hover:text-slate-600',
        )}
      >
        {isReporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Flag className="w-4 h-4" />
        )}
        {reported ? 'Reported' : 'Report'}
      </button>

      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This post will be flagged for moderator review. Please only report
              posts that violate community guidelines.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleReportConfirm()}
              className="bg-red-600 hover:bg-red-700"
            >
              Report Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
