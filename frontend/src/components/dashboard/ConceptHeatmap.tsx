type Row = { concept: string; mastery: number }

function cellColor(mastery: number): string {
  if (mastery >= 0.75) return 'bg-success/85'
  if (mastery >= 0.6) return 'bg-warning/80'
  return 'bg-danger/75'
}

export function ConceptHeatmap({ rows }: { rows: Row[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {rows.map((r) => (
        <div
          key={r.concept}
          title={`${r.concept}: ${Math.round(r.mastery * 100)}%`}
          className={`${cellColor(r.mastery)} text-surface flex min-w-[5.5rem] flex-col rounded-[var(--radius-sm)] px-2 py-2 text-center text-xs font-medium shadow-sm`}
        >
          <span className="leading-tight">{r.concept}</span>
          <span className="font-mono mt-1 text-[0.7rem] opacity-90">
            {Math.round(r.mastery * 100)}%
          </span>
        </div>
      ))}
    </div>
  )
}
