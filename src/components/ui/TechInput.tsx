'use client'

import * as React from 'react'
import { Input, type InputProps } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TechInputProps extends InputProps {
  label?: string
  status?: 'default' | 'success' | 'error'
}

export const TechInput = React.forwardRef<HTMLInputElement, TechInputProps>(
  ({ className, label, status = 'default', id, ...props }, ref) => {
    // Generate a stable ID if not provided but label exists
    const inputId =
      id ||
      (label
        ? `tech-input-${label.toLowerCase().replaceAll(/\s+/g, '-')}`
        : undefined)

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center gap-2"
          >
            {'>'} {label}
          </label>
        )}
        <div className="relative">
          <Input
            ref={ref}
            id={inputId}
            className={cn(
              'bg-white font-mono pl-4 border-l-4 transition-all',
              status === 'default' &&
                'border-l-slate-200 focus:border-l-cyan-600 focus-visible:ring-cyan-600/20',
              status === 'success' && 'border-l-green-500 bg-green-50',
              status === 'error' && 'border-l-amber-500 bg-amber-50',
              className,
            )}
            {...props}
          />
        </div>
      </div>
    )
  },
)
TechInput.displayName = 'TechInput'
