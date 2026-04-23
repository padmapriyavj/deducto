type Props = { value: number }

export function CoinCounter({ value }: Props) {
  return (
    <div className="bg-surface shadow-soft border-divider/60 flex h-full min-h-[5.5rem] items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3">
      <span className="text-gold text-2xl" aria-hidden>
        🪙
      </span>
      <div>
        <p className="text-foreground/70 text-xs font-medium uppercase tracking-wide">
          Coins
        </p>
        <p className="font-mono text-foreground text-2xl leading-none">{value}</p>
      </div>
    </div>
  )
}
