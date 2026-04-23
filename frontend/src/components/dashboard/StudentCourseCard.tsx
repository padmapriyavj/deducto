import { useState } from 'react'
import { Link } from 'react-router'

import type { StudentCourseMock } from '@/lib/mocks/studentDashboard'

type Props = { course: StudentCourseMock }

export function StudentCourseCard({ course }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <article className="bg-surface shadow-soft border-divider/60 rounded-[var(--radius-lg)] border text-left">
      <div className="border-divider/40 flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-heading text-foreground text-lg">{course.name}</h3>
          <p className="text-foreground/75 mt-1 text-sm">
            Tests taken: <span className="font-mono">{course.testsTaken}</span>
            {' · '}
            Coins here: <span className="font-mono">{course.coinsFromCourse}</span>
          </p>
          <p className="text-warning mt-1 text-sm">
            Top weak concept: <strong>{course.topWeakConcept}</strong>
          </p>
          {course.tempoLive ? (
            <p className="text-secondary mt-2 text-xs font-semibold uppercase tracking-wide">
              Tempo live now
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link
            to={`/student/practice/lobby/${course.id}`}
            state={{ courseName: course.name }}
            className="bg-secondary text-surface hover:opacity-95 inline-flex rounded-[var(--radius-sm)] px-4 py-2 text-center text-sm font-semibold transition-opacity"
          >
            Start practice test
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-primary text-sm font-medium underline-offset-2 hover:underline"
            aria-expanded={open}
          >
            {open ? 'Hide course detail' : 'View course detail'}
          </button>
        </div>
      </div>
      {open ? (
        <div className="space-y-4 p-4">
          <section>
            <h4 className="text-foreground mb-2 text-sm font-semibold">Upcoming</h4>
            <ul className="text-foreground/80 space-y-1 text-sm">
              {course.upcomingEvents.map((e) => (
                <li key={e.id}>
                  <span className="font-medium">{e.title}</span> — {e.date}
                </li>
              ))}
              {course.upcomingEvents.length === 0 ? (
                <li className="text-foreground/60">No upcoming events.</li>
              ) : null}
            </ul>
          </section>
          <section>
            <h4 className="text-foreground mb-2 text-sm font-semibold">Completed</h4>
            <ul className="space-y-3">
              {course.completedEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="border-divider/50 bg-background/60 rounded-[var(--radius-sm)] border px-3 py-2 text-sm"
                >
                  <p className="font-medium">{ev.title}</p>
                  <p className="text-foreground/75 mt-1">
                    Questions: {ev.attempted} · Correct:{' '}
                    <span className="text-success">{ev.correct}</span> · Wrong:{' '}
                    <span className="text-danger">{ev.wrong}</span>
                  </p>
                  <p className="text-foreground/70 mt-1 text-xs">
                    Concepts: {ev.concepts.join(', ')}
                  </p>
                  <p className="text-gold mt-1 text-xs">+{ev.coins} coins</p>
                  <p className="text-foreground/80 mt-1 text-xs">{ev.betcha}</p>
                </li>
              ))}
              {course.completedEvents.length === 0 ? (
                <li className="text-foreground/60 text-sm">No completed events yet.</li>
              ) : null}
            </ul>
          </section>
        </div>
      ) : null}
    </article>
  )
}

export function StudentCoachCta() {
  return (
    <Link
      to="/coach"
      className="bg-primary text-surface shadow-soft inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-95 sm:w-auto"
    >
      Chat with Finn
    </Link>
  )
}
