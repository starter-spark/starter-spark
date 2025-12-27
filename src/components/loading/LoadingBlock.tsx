import type { ComponentPropsWithoutRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const toneClasses = {
  neutral: 'bg-accent',
  subtle: 'bg-slate-50',
  soft: 'bg-slate-100',
  strong: 'bg-slate-200',
  accent: 'bg-cyan-50',
  warning: 'bg-amber-50',
  success: 'bg-green-100',
  deep: 'bg-slate-700',
} as const

type Tone = keyof typeof toneClasses

const getToneClass = (tone: Tone) => {
  switch (tone) {
    case 'neutral':
      return toneClasses.neutral
    case 'subtle':
      return toneClasses.subtle
    case 'soft':
      return toneClasses.soft
    case 'strong':
      return toneClasses.strong
    case 'accent':
      return toneClasses.accent
    case 'warning':
      return toneClasses.warning
    case 'success':
      return toneClasses.success
    case 'deep':
      return toneClasses.deep
    default:
      return toneClasses.neutral
  }
}

type LoadingBlockProps = ComponentPropsWithoutRef<'div'> & {
  tone?: Tone
}

export function LoadingBlock({
  className,
  tone = 'neutral',
  ...props
}: LoadingBlockProps) {
  return (
    <Skeleton className={cn(getToneClass(tone), className)} {...props} />
  )
}
