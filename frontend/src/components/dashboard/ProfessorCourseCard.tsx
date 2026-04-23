import { useState } from 'react'

import { ConceptHeatmap } from '@/components/dashboard/ConceptHeatmap'
import type { ProfessorCourseMock } from '@/lib/mocks/professorDashboard'

const rosterCell = 'px-4 py-3.5 align-top sm:px-5 sm:py-4'

type Props = { course: ProfessorCourseMock }

export function ProfessorCourseCard({ course }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <article className="bg-surface shadow-soft border-divider/60 rounded-[var(--radius-lg)] border text-left">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-heading text-foreground text-lg">{course.name}</h3>
          <p className="text-foreground/75 mt-1 text-sm">
            Enrollment: <span className="font-mono">{course.enrollment}</span>
            {' · '}
            Tempos scheduled: <span className="font-mono">{course.temposScheduled}</span>
            {' · '}
            Class avg:{' '}
            <span className="font-mono">{Math.round(course.classAvgPct)}%</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-primary shrink-0 text-sm font-medium underline-offset-2 hover:underline"
          aria-expanded={open}
        >
          {open ? 'Hide drill-down' : 'Drill down'}
        </button>
      </div>
      {open ? (
        <div className="border-divider/40 space-y-6 border-t p-4">
          <section>
            <h4 className="text-foreground mb-3 text-sm font-semibold">Student roster</h4>
            <div className="border-divider/50 bg-background/30 overflow-x-auto rounded-[var(--radius-md)] border p-4 sm:p-5">
              <table className="text-foreground/85 w-full min-w-[320px] border-collapse text-sm">
                <thead>
                  <tr className="border-divider/60 bg-surface/80 text-foreground/60 border-b text-left text-xs uppercase tracking-wide">
                    <th className={`${rosterCell} font-medium`}>Student</th>
                    <th className={`${rosterCell} font-medium`}>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {course.roster.map((row) => (
                    <tr key={row.id} className="border-divider/40 border-b last:border-0">
                      <td className={`${rosterCell} font-medium`}>{row.displayName}</td>
                      <td className={`${rosterCell} text-foreground/85`}>{row.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <h4 className="text-foreground mb-2 text-sm font-semibold">
              Concept performance (class)
            </h4>
            <ConceptHeatmap rows={course.heatmap} />
          </section>
        </div>
      ) : null}
    </article>
  )
}
