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
import { MoreHorizontal, Check, RotateCcw, Flag, Trash2, Loader2 } from 'lucide-react'
import { updatePostStatus, deletePost } from './actions'

interface CommunityActionsProps {
  postId: string
  status: string
}

export function CommunityActions({ postId, status }: CommunityActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    const result = await updatePostStatus(postId, newStatus)

    if (result.error) {
      toast.error('Failed to update post status', { description: result.error })
    } else {
      toast.success(`Post ${newStatus === 'open' ? 'approved' : newStatus}`)
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleDeleteConfirm = async () => {
    setShowDeleteDialog(false)
    setIsLoading(true)
    const result = await deletePost(postId)

    if (result.error) {
      toast.error('Failed to delete post', { description: result.error })
    } else {
      toast.success('Post deleted')
      router.refresh()
    }

    setIsLoading(false)
  }

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
          {status === 'flagged' && (
            <DropdownMenuItem
              onClick={() => void handleStatusChange('open')}
            >
              <Check className="mr-2 h-4 w-4 text-green-600" />
              Approve
            </DropdownMenuItem>
          )}
          {status === 'solved' && (
            <DropdownMenuItem onClick={() => void handleStatusChange('open')}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reopen
            </DropdownMenuItem>
          )}
          {status !== 'flagged' && (
            <DropdownMenuItem onClick={() => void handleStatusChange('flagged')}>
              <Flag className="mr-2 h-4 w-4 text-amber-600" />
              Flag
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post and all its comments will
              be permanently deleted.
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
