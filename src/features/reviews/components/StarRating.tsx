import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StarRating({
  value,
  className,
  size = 'md',
  label,
}: {
  value: number
  className?: string
  size?: 'sm' | 'md'
  label?: string
}) {
  const clamped = Math.max(0, Math.min(5, value))
  const rounded = Math.round(clamped * 2) / 2

  const full = Math.floor(rounded)
  const hasHalf = rounded - full >= 0.5

  const iconClassName = cn(size === 'sm' ? 'h-4 w-4' : 'h-5 w-5', 'shrink-0')

  const ariaLabel = label || `${rounded.toFixed(1)} out of 5 stars`

  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={ariaLabel}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1
        if (idx <= full) {
          return (
            <Star
              key={idx}
              className={cn(iconClassName, 'fill-amber-400 text-amber-400')}
              aria-hidden="true"
            />
          )
        }
        if (idx === full + 1 && hasHalf) {
          return (
            <StarHalf
              key={idx}
              className={cn(iconClassName, 'fill-amber-400 text-amber-400')}
              aria-hidden="true"
            />
          )
        }
        return (
          <Star
            key={idx}
            className={cn(iconClassName, 'text-slate-300')}
            aria-hidden="true"
          />
        )
      })}
    </span>
  )
}
