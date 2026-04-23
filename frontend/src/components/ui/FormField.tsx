import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

export const fieldInputClass =
  'border-divider bg-surface text-foreground placeholder:text-foreground/40 focus:border-primary min-h-11 w-full rounded-[var(--radius-sm)] border px-3 py-2.5 text-sm outline-none transition-colors'

type Base = {
  id: string
  label: string
  error?: ReactNode
  hint?: ReactNode
  inputClassName?: string
}

function describedByIds(id: string, error?: ReactNode, hint?: ReactNode) {
  const parts: string[] = []
  if (error) parts.push(`${id}-error`)
  if (hint) parts.push(`${id}-hint`)
  return parts.length ? parts.join(' ') : undefined
}

export function TextField({
  id,
  label,
  error,
  hint,
  className = '',
  inputClassName = '',
  ...inputProps
}: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="mb-0.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByIds(id, error, hint)}
        className={`${fieldInputClass} ${inputClassName} ${error ? 'border-danger/60' : ''} ${className}`.trim()}
        {...inputProps}
      />
      {hint ? (
        <p id={`${id}-hint`} className={`text-xs ${error ? 'text-foreground/45' : 'text-foreground/60'}`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-danger text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function TextAreaField({
  id,
  label,
  error,
  hint,
  className = '',
  ...props
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="mb-0.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedByIds(id, error, hint)}
        className={`${fieldInputClass} min-h-[5.5rem] resize-y ${error ? 'border-danger/60' : ''} ${className}`.trim()}
        {...props}
      />
      {hint ? (
        <p id={`${id}-hint`} className={`text-xs ${error ? 'text-foreground/45' : 'text-foreground/60'}`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-danger text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
