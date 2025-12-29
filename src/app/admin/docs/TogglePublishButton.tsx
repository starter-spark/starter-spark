'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleDocPagePublished } from './actions'

interface TogglePublishButtonProps {
  pageId: string
  isPublished: boolean
}

export function TogglePublishButton({
  pageId,
  isPublished,
}: TogglePublishButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentState, setCurrentState] = useState(isPublished)

  async function handleToggle() {
    setIsUpdating(true)
    try {
      const result = await toggleDocPagePublished(pageId, !currentState)
      if (result.error) {
        toast.error('Failed to update page', { description: result.error })
      } else {
        setCurrentState(!currentState)
        toast.success(currentState ? 'Page unpublished' : 'Page published')
      }
    } catch {
      toast.error('Failed to update page')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => void handleToggle()}
      disabled={isUpdating}
      className={currentState ? 'text-green-600' : 'text-slate-400'}
      title={currentState ? 'Click to unpublish' : 'Click to publish'}
    >
      {currentState ? (
        <Eye className="w-4 h-4" />
      ) : (
        <EyeOff className="w-4 h-4" />
      )}
    </Button>
  )
}
