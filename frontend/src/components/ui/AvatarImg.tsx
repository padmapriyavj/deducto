import { useState } from 'react'

import type { AvatarUserLike } from '@/lib/avatarUrl'
import { userAvatarUrl } from '@/lib/avatarUrl'

type Props = {
  user: AvatarUserLike
  /** Initials when image fails (e.g. "AB") */
  fallbackInitials: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-11 w-11 text-base',
}

export function AvatarImg({ user, fallbackInitials, size = 'md', className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  const dim = sizes[size]

  if (failed) {
    return (
      <span
        className={`bg-primary/15 text-primary inline-flex items-center justify-center rounded-full font-semibold ${dim} ${className}`.trim()}
        aria-hidden
      >
        {fallbackInitials.slice(0, 2).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      src={userAvatarUrl(user)}
      alt=""
      width={size === 'sm' ? 32 : size === 'md' ? 40 : 44}
      height={size === 'sm' ? 32 : size === 'md' ? 40 : 44}
      className={`inline-block rounded-full object-cover ring-2 ring-divider/40 ${dim} ${className}`.trim()}
      onError={() => setFailed(true)}
    />
  )
}
