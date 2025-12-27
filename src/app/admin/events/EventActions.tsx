'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Edit,
  ExternalLink,
  Trash2,
  Loader2,
} from 'lucide-react'
import { deleteEvent } from './actions'

interface EventActionsProps {
  eventId: string
  slug: string
}

export function EventActions({ eventId, slug }: EventActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this event? This cannot be undone.',
      )
    ) {
      return
    }

    setIsLoading(true)
    const result = await deleteEvent(eventId)

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
        <DropdownMenuItem asChild>
          <Link href={`/admin/events/${slug}`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/events`} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Site
          </Link>
        </DropdownMenuItem>
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
