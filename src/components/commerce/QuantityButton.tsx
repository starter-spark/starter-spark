import * as React from 'react'
import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'w-7 h-7',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
}

const toneClasses = {
  neutral: 'border-slate-200 hover:border-slate-300',
  danger: 'border-red-200 hover:border-red-300 hover:bg-red-50',
}

function getSizeClass(size: QuantityButtonProps['size']) {
  switch (size) {
    case 'sm':
      return sizeClasses.sm
    case 'lg':
      return sizeClasses.lg
    case 'md':
    default:
      return sizeClasses.md
  }
}

function getToneClass(tone: QuantityButtonProps['tone']) {
  switch (tone) {
    case 'danger':
      return toneClasses.danger
    case 'neutral':
    default:
      return toneClasses.neutral
  }
}

export interface QuantityButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: keyof typeof sizeClasses
  tone?: keyof typeof toneClasses
}

export function QuantityButton({
  size = 'md',
  tone = 'neutral',
  className,
  type = 'button',
  ...props
}: QuantityButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'rounded border flex items-center justify-center transition-colors cursor-pointer',
        getSizeClass(size),
        getToneClass(tone),
        className,
      )}
      {...props}
    />
  )
}
