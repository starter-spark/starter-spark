'use client'

import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ActionStatus = 'idle' | 'pending' | 'success' | 'error'

type ActionStatusProps = {
  status: ActionStatus
  message?: string
  pendingLabel?: string
  successLabel?: string
  errorLabel?: string
  className?: string
}

const statusStyles: Record<
  Exclude<ActionStatus, 'idle'>,
  { classes: string; icon: typeof AlertCircle }
> = {
  pending: {
    classes: 'bg-slate-50 border-slate-200 text-slate-600',
    icon: Loader2,
  },
  success: {
    classes: 'bg-green-50 border-green-200 text-green-700',
    icon: CheckCircle,
  },
  error: {
    classes: 'bg-red-50 border-red-200 text-red-700',
    icon: AlertCircle,
  },
}

export function ActionStatusBanner({
  status,
  message,
  pendingLabel = 'Working...',
  successLabel = 'Success.',
  errorLabel = 'Something went wrong.',
  className,
}: ActionStatusProps) {
  if (status === 'idle') return null

  // eslint-disable-next-line security/detect-object-injection
  const { classes, icon: Icon } = statusStyles[status]
  const fallback =
    status === 'pending'
      ? pendingLabel
      : status === 'success'
        ? successLabel
        : errorLabel

  return (
    <div
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 rounded border px-3 py-2 text-sm font-mono',
        classes,
        className,
      )}
    >
      <Icon className={cn('w-4 h-4', status === 'pending' && 'animate-spin')} />
      <span>{message || fallback}</span>
    </div>
  )
}
