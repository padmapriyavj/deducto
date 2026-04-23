import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/FormField'
import { SimpleModal } from '@/components/ui/SimpleModal'
import { parseClassMeetings, suggestNextTempoSlotLocal, WEEKDAY_LABELS } from '@/lib/classSchedule'
import { addNotification } from '@/lib/courseContentLocal'
import { queryKeys } from '@/lib/queryKeys'
import { useCourseQuery } from '@/lib/queries/courseQueries'
import { useDevFireTempoMutation, useScheduleTempoMutation } from '@/lib/queries/tempoQueries'
import { useAuthStore } from '@/stores/authStore'

type Props = {
  courseId: number
  lessonId: string
  courseName: string
  quizId: string
  isOpen: boolean
  onClose: () => void
}

function courseTimezone(schedule: Record<string, unknown> | undefined): string {
  const t = schedule?.timezone
  return typeof t === 'string' && t.trim() ? t.trim() : 'UTC'
}

export function ScheduleTempoModal({ courseId, lessonId, courseName, quizId, isOpen, onClose }: Props) {
  const queryClient = useQueryClient()
  const token = useAuthStore((s) => s.token)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('12:00')
  const scheduleMut = useScheduleTempoMutation(token)
  const fireMut = useDevFireTempoMutation()
  const courseQuery = useCourseQuery(courseId)
  const prefilledRef = useRef(false)

  const scheduleRecord = courseQuery.data?.schedule as Record<string, unknown> | undefined
  const meetings = useMemo(() => parseClassMeetings(scheduleRecord), [scheduleRecord])
  const tz = useMemo(() => courseTimezone(scheduleRecord), [scheduleRecord])

  useEffect(() => {
    if (!isOpen) {
      prefilledRef.current = false
      return
    }
    if (!courseQuery.data || prefilledRef.current) return
    const m = parseClassMeetings(courseQuery.data.schedule as Record<string, unknown> | undefined)
    const next = suggestNextTempoSlotLocal(m, new Date())
    if (next) {
      setDate(next.date)
      setTime(next.time)
    }
    prefilledRef.current = true
  }, [isOpen, courseQuery.data])

  const schedule = () => {
    const qNum = parseInt(String(quizId).trim(), 10)
    if (Number.isNaN(qNum) || qNum <= 0) return
    const iso = new Date(`${date}T${time}:00`).toISOString()
    scheduleMut.mutate(
      { quiz_id: qNum, scheduled_at: iso },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.temposUpcoming })
          void queryClient.invalidateQueries({ queryKey: queryKeys.temposJoinable })
          void queryClient.invalidateQueries({ queryKey: queryKeys.course(courseId) })
          addNotification({
            title: 'Tempo scheduled',
            body: `Tempo for ${courseName} scheduled.`,
            type: 'tempo',
          })
          onClose()
        },
      },
    )
  }

  const fireNow = () => {
    fireMut.mutate(quizId, {
      onSuccess: () => {
        addNotification({
          title: 'Tempo live',
          body: `Dev: Tempo broadcast fired for ${courseName}.`,
          type: 'tempo',
        })
        onClose()
      },
    })
  }

  return (
    <SimpleModal title="Schedule Tempo" isOpen={isOpen} onClose={onClose}>
      <p className="text-foreground/70 mb-2 text-xs">
        Course #{courseId} · lesson <span className="font-mono">{lessonId}</span>
      </p>
      <p className="text-foreground/70 mb-4 text-sm">
        Pick when this Tempo goes live. The server checks that the time falls within a configured class meeting in{' '}
        <span className="font-mono">{tz}</span>. Practice quizzes are promoted to type <span className="font-mono">tempo</span>{' '}
        when scheduled. Use <span className="font-mono">Fire now</span> for demos (broadcasts{' '}
        <span className="font-mono">tempo:fire</span>).
      </p>
      {meetings.length > 0 ? (
        <ul className="text-foreground/80 mb-4 list-inside list-disc text-xs">
          {meetings.map((m) => (
            <li key={`${m.weekday}-${m.start}-${m.end}`}>
              {WEEKDAY_LABELS[m.weekday] ?? `Day ${m.weekday}`}: {m.start}–{m.end}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-foreground/70 mb-4 text-xs">
          No class meeting pattern on this course yet — any time is allowed. Add meeting times under Edit course on
          the course page.
        </p>
      )}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField id="tempo-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField id="tempo-time" label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      {scheduleMut.isError ? (
        <p className="text-danger mb-2 text-sm" role="alert">
          {scheduleMut.error instanceof Error ? scheduleMut.error.message : 'Schedule failed'}
        </p>
      ) : null}
      {fireMut.isError ? (
        <p className="text-danger mb-2 text-sm" role="alert">
          {fireMut.error instanceof Error ? fireMut.error.message : 'Fire failed'}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" onClick={schedule} disabled={scheduleMut.isPending || !quizId.trim()}>
          {scheduleMut.isPending ? 'Scheduling…' : 'Schedule'}
        </Button>
        <Button type="button" variant="secondary" onClick={fireNow} disabled={fireMut.isPending || !quizId.trim()}>
          {fireMut.isPending ? 'Firing…' : 'Fire now (dev)'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Skip
        </Button>
      </div>
    </SimpleModal>
  )
}
