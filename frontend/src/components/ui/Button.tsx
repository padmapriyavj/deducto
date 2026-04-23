import { type ButtonHTMLAttributes, forwardRef } from 'react'

const variants = {
  primary:
    'bg-primary text-surface hover:opacity-95 shadow-soft border border-primary/20',
  secondary:
    'bg-secondary text-surface hover:opacity-95 border border-secondary/20',
  ghost:
    'border-divider text-foreground hover:bg-surface bg-transparent border',
  danger: 'text-danger border-danger/40 hover:bg-danger/5 border bg-transparent',
} as const

const sizes = {
  sm: 'min-h-9 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)]',
  md: 'min-h-11 px-4 py-2.5 text-sm font-semibold rounded-[var(--radius-sm)]',
} as const

export type ButtonVariant = keyof typeof variants
export type ButtonSize = keyof typeof sizes

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, className = '', disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      {...rest}
    />
  )
})
