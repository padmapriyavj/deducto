type SpinnerProps = {
  label?: string
  className?: string
}

export function Spinner({ label = 'Loading', className = '' }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`.trim()} role="status">
      <div
        className="border-divider border-t-primary h-9 w-9 animate-spin rounded-full border-2"
        aria-hidden
      />
      <p className="text-foreground/70 text-sm">{label}</p>
    </div>
  )
}
