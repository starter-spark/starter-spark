'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  EyeOff,
  Check,
  Flag,
  Clock,
  Trash2,
  Loader2,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { deleteReview, updateReviewStatus } from './actions'

export function ReviewActions({
  reviewId,
  status,
}: {
  reviewId: string
  status: string
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showHideDialog, setShowHideDialog] = useState(false)
  const [hideReason, setHideReason] = useState('')

  const runStatusChange = async (
    nextStatus: string,
    reason?: string | null,
  ) => {
    setIsLoading(true)
    const result = await updateReviewStatus(reviewId, nextStatus, reason)

    if (result.error) {
      toast.error('Failed to update review', { description: result.error })
    } else {
      toast.success('Review updated')
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleDeleteConfirm = async () => {
    setShowDeleteDialog(false)
    setIsLoading(true)
    const result = await deleteReview(reviewId)

    if (result.error) {
      toast.error('Failed to delete review', { description: result.error })
    } else {
      toast.success('Review deleted')
      router.refresh()
    }

    setIsLoading(false)
  }

  const canHide = status !== 'hidden'
  const canPublish = status !== 'published'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canPublish && (
            <DropdownMenuItem onClick={() => void runStatusChange('published')}>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              Publish
            </DropdownMenuItem>
          )}

          {status !== 'flagged' && (
            <DropdownMenuItem onClick={() => void runStatusChange('flagged')}>
              <Flag className="mr-2 h-4 w-4 text-amber-600" />
              Mark as reported
            </DropdownMenuItem>
          )}

          {status !== 'pending' && (
            <DropdownMenuItem onClick={() => void runStatusChange('pending')}>
              <Clock className="mr-2 h-4 w-4 text-slate-600" />
              Move to pending
            </DropdownMenuItem>
          )}

          {canHide && (
            <DropdownMenuItem onClick={() => setShowHideDialog(true)}>
              <EyeOff className="mr-2 h-4 w-4 text-slate-600" />
              Hide
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showHideDialog} onOpenChange={setShowHideDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide this review?</AlertDialogTitle>
            <AlertDialogDescription>
              Hidden reviews are removed from the public product page. Use this
              for spam, harassment, personal info, or other policy violations.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4">
            <Label htmlFor="hide-reason" className="text-sm text-slate-700">
              Internal reason (optional)
            </Label>
            <Textarea
              id="hide-reason"
              value={hideReason}
              onChange={(e) => setHideReason(e.target.value)}
              className="mt-2 min-h-[90px]"
              placeholder="Why was this review hidden?"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowHideDialog(false)
                void runStatusChange('hidden', hideReason)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Hide review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The review will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteConfirm()}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
