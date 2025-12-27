'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Check, X, Flag, Trash2, Loader2 } from 'lucide-react'
import { updatePostStatus, deletePost } from './actions'

interface CommunityActionsProps {
  postId: string
  status: string
}

export function CommunityActions({ postId, status }: CommunityActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    const result = await updatePostStatus(postId, newStatus)

    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this post? This cannot be undone.',
      )
    ) {
      return
    }

    setIsLoading(true)
    const result = await deletePost(postId)

    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
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
        {status !== 'published' && (
          <DropdownMenuItem
            onClick={() => void handleStatusChange('published')}
          >
            <Check className="mr-2 h-4 w-4 text-green-600" />
            Approve
          </DropdownMenuItem>
        )}
        {status !== 'pending' && (
          <DropdownMenuItem onClick={() => void handleStatusChange('pending')}>
            <X className="mr-2 h-4 w-4" />
            Set Pending
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
          onClick={() => void handleDelete()}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
