import { type ReactNode, useEffect, useId, useRef } from 'react'

type Props = {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export function SimpleModal({ title, isOpen, onClose, children }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('button, [href], input')?.focus()
    }, 0)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-foreground/50 absolute inset-0 backdrop-blur-sm"
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="border-divider bg-surface relative z-10 flex max-h-[90dvh] w-full flex-col rounded-t-[var(--radius-xl)] border shadow-2xl sm:max-h-[min(90dvh,720px)] sm:max-w-md sm:rounded-[var(--radius-lg)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-divider/60 flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
          <h2 id={titleId} className="font-heading text-foreground pr-2 text-lg leading-snug">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/70 hover:text-foreground hover:bg-background -mr-1 -mt-1 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-lg leading-none"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
