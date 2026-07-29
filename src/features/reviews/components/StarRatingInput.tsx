'use client'

import * as React from 'react'
import * as RadioGroup from '@radix-ui/react-radio-group'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StarRatingInput({
  value,
  onValueChange,
  disabled,
  className,
  ariaLabel = 'Rating',
}: {
  value: number
  onValueChange: (next: number) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
}) {
  const stringValue = String(value || '')

  return (
    <RadioGroup.Root
      value={stringValue}
      onValueChange={(v) => {
        const next = Number.parseInt(v, 10)
        if (Number.isFinite(next)) onValueChange(next)
      }}
      aria-label={ariaLabel}
      className={cn('flex items-center gap-1', className)}
      disabled={disabled}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1
        const selected = starValue <= value
        return (
          <RadioGroup.Item
            key={starValue}
            value={String(starValue)}
            aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
            className={cn(
              'rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700/20 focus-visible:ring-offset-2',
              disabled && 'opacity-60 cursor-not-allowed',
            )}
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                selected ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
              )}
              aria-hidden="true"
            />
          </RadioGroup.Item>
        )
      })}
    </RadioGroup.Root>
  )
}
