import type { BetchaMultiplier } from '@/lib/mocks/quizRun'

type Props = {
  value: BetchaMultiplier
  onChange: (v: BetchaMultiplier) => void
  /** After first question is shown, Betcha is locked (PRD §7.7). */
  locked?: boolean
  disabled?: boolean
}

const options: { value: BetchaMultiplier; label: string; hint: string }[] = [
  { value: 1, label: '1× Safe', hint: 'Proportional payout' },
  { value: 3, label: '3× Bold', hint: 'Need 70%+ for full multiplier' },
  { value: 5, label: '5× All-in', hint: 'Need 90%+ for full multiplier' },
]

export function BetchaSelector({ value, onChange, locked, disabled }: Props) {
  const off = disabled || locked
  return (
    <fieldset
      className="border-divider/60 bg-surface rounded-[var(--radius-md)] border p-4 text-left"
      aria-disabled={off}
    >
      <legend className="text-foreground px-1 text-sm font-semibold">Betcha</legend>
      <p className="text-foreground/70 mb-3 text-xs">
        Locked once the first question appears (PRD §7.7).
        {locked ? <span className="text-secondary ml-1 font-medium">Locked.</span> : null}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={`border-divider flex cursor-pointer flex-col rounded-[var(--radius-sm)] border px-3 py-2 text-sm transition-colors ${
              value === o.value
                ? 'border-primary bg-primary/10 ring-primary/30 ring-2'
                : 'hover:border-primary/50'
            } ${off ? 'pointer-events-none opacity-50' : ''}`}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="betcha"
                value={o.value}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
                disabled={off}
              />
              <span className="font-medium">{o.label}</span>
            </span>
            <span className="text-foreground/65 mt-1 pl-6 text-xs">{o.hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
