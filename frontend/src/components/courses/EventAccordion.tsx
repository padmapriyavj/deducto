import { useState } from 'react'

export type CompletedEvent = {
  id: string
  title: string
  date: string
  attempted: number
  correct: number
  wrong: number
  coins: number
  betcha: string
  concepts: string[]
}

export function EventAccordion({ events }: { events: CompletedEvent[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (events.length === 0) {
    return <p className="text-foreground/70 text-sm">No completed events yet.</p>
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((ev) => {
        const open = openId === ev.id
        const accuracy = ev.attempted > 0 ? Math.round((ev.correct / ev.attempted) * 100) : 0
        return (
          <button
            key={ev.id}
            type="button"
            onClick={() => setOpenId(open ? null : ev.id)}
            className="border-divider/60 bg-surface shadow-soft hover:border-primary/40 rounded-[var(--radius-lg)] border p-4 text-left transition-colors"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="bg-success/10 text-success flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg">
                ✓
              </div>
              <span className="text-gold bg-gold/10 rounded-full px-2 py-0.5 font-mono text-xs font-medium">
                +{ev.coins}
              </span>
            </div>
            <p className="text-foreground mb-1 truncate text-sm font-medium">{ev.title}</p>
            <p className="text-foreground/60 text-xs">
              {ev.correct}/{ev.attempted} correct ({accuracy}%)
            </p>
            {open ? (
              <div className="border-divider/40 mt-3 border-t pt-3 text-xs">
                <p className="text-foreground/70">
                  {ev.wrong} wrong · Betcha: {ev.betcha}
                </p>
                {ev.concepts.length > 0 ? (
                  <p className="text-foreground/60 mt-1 truncate">
                    Concepts: {ev.concepts.join(', ')}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-primary mt-2 text-xs">Tap for details</p>
            )}
          </button>
        )
      })}
    </div>
  )
}
