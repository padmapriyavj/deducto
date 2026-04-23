import { type KeyboardEvent, useEffect, useId, useRef } from 'react'

import type { MockQuestion } from '@/lib/mocks/quizRun'

type Props = {
  question: MockQuestion
  selectedIndex: number | null
  onSelect: (index: number) => void
  disabled?: boolean
  /** When this changes (e.g. next question), focus moves to the first choice. */
  focusResetKey: string | number
}

export function QuestionCard({
  question,
  selectedIndex,
  onSelect,
  disabled,
  focusResetKey,
}: Props) {
  const baseId = useId()
  const promptId = `${baseId}-prompt`
  const count = question.choices.length
  const firstOptionRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (disabled) return
    window.requestAnimationFrame(() => {
      firstOptionRef.current?.focus()
    })
  }, [focusResetKey, disabled])

  useEffect(() => {
    if (disabled || selectedIndex === null) return
    const el = document.getElementById(`${baseId}-option-${selectedIndex}`)
    if (el instanceof HTMLElement) el.focus()
  }, [selectedIndex, disabled, baseId])

  const tabIndexFor = (i: number) => {
    if (disabled) return -1
    if (selectedIndex === null) return i === 0 ? 0 : -1
    return selectedIndex === i ? 0 : -1
  }

  const onGroupKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (disabled) return
    const key = e.key
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
      return
    }
    e.preventDefault()
    const down = key === 'ArrowDown' || key === 'ArrowRight'
    const up = key === 'ArrowUp' || key === 'ArrowLeft'
    if (key === 'Home') {
      onSelect(0)
      return
    }
    if (key === 'End') {
      onSelect(count - 1)
      return
    }
    if (down) {
      const base = selectedIndex ?? -1
      const next = base < 0 ? 0 : (base + 1) % count
      onSelect(next)
      return
    }
    if (up) {
      const base = selectedIndex ?? 0
      const next = base <= 0 ? count - 1 : base - 1
      onSelect(next)
    }
  }

  return (
    <div className="bg-surface border-divider/60 rounded-[var(--radius-lg)] border p-6 text-left">
      <h2
        id={promptId}
        className="font-heading text-foreground mb-4 text-lg leading-snug"
      >
        {question.prompt}
      </h2>
      <ul
        role="radiogroup"
        aria-labelledby={promptId}
        aria-disabled={disabled}
        className="space-y-2"
        onKeyDown={onGroupKeyDown}
      >
        {question.choices.map((c, i) => {
          const selected = selectedIndex === i
          return (
            <li key={i}>
              <button
                ref={i === 0 ? firstOptionRef : undefined}
                id={`${baseId}-option-${i}`}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={tabIndexFor(i)}
                disabled={disabled}
                onClick={() => onSelect(i)}
                className={`border-divider text-foreground hover:border-primary/40 focus-visible:ring-primary min-h-12 w-full rounded-[var(--radius-sm)] border px-4 py-3.5 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] ${
                  selected ? 'border-primary bg-primary/10 ring-primary/25 ring-2' : ''
                } ${disabled ? 'opacity-60' : ''}`}
              >
                <span className="font-mono text-foreground/60 mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                {c}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
