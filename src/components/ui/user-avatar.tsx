'use client'

import { useState } from 'react'
import { getUserAvatarUrl, getInitials } from '@/lib/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user: {
    id: string
    full_name?: string | null
    email?: string | null
    avatar_url?: string | null
    avatar_seed?: string | null
  }
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showFallback?: boolean
}

function getSizeClass(size: 'sm' | 'md' | 'lg' | 'xl'): string {
  switch (size) {
    case 'sm':
      return 'h-6 w-6 text-xs'
    case 'md':
      return 'h-8 w-8 text-sm'
    case 'lg':
      return 'h-10 w-10 text-base'
    case 'xl':
      return 'h-16 w-16 text-xl'
  }
}

function getSizePixels(size: 'sm' | 'md' | 'lg' | 'xl'): number {
  switch (size) {
    case 'sm':
      return 24
    case 'md':
      return 32
    case 'lg':
      return 40
    case 'xl':
      return 64
  }
}

export function UserAvatar({
  user,
  size = 'md',
  className,
  showFallback = true,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)

  const sizeClass = getSizeClass(size)
  const sizePixels = getSizePixels(size)

  const avatarUrl = getUserAvatarUrl({
    id: user.id,
    avatarUrl: user.avatar_url,
    avatarSeed: user.avatar_seed,
    size: sizePixels * 2, // 2x for retina
  })

  const initials = getInitials(user.full_name || user.email)
  const displayName = user.full_name || user.email || 'User'

  // Show initials fallback if image fails to load
  if (imageError && showFallback) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-slate-100 font-medium text-slate-600',
          sizeClass,
          className,
        )}
        title={displayName}
      >
        {initials}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={displayName}
      className={cn('rounded-full object-cover', sizeClass, className)}
      onError={() => {
        setImageError(true)
      }}
    />
  )
}
