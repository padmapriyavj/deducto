type Props = { days: number }

export function StreakFlame({ days }: Props) {
  return (
    <div className="bg-surface shadow-soft border-divider/60 flex h-full min-h-[5.5rem] items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3">
      <span className="text-gold text-2xl" aria-hidden>
        🔥
      </span>
      <div>
        <p className="text-foreground/70 text-xs font-medium uppercase tracking-wide">
          Streak
        </p>
        <p className="font-heading text-foreground text-2xl leading-none">{days} days</p>
      </div>
    </div>
  )
}
