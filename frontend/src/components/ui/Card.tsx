import type { HTMLAttributes } from 'react'

type Padding = 'none' | 'sm' | 'md' | 'lg'

const paddings: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
}

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: Padding
}

export function Card({ padding = 'md', className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`bg-surface shadow-soft border-divider/60 rounded-[var(--radius-lg)] border text-left ${paddings[padding]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  )
}
