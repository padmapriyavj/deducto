import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { TextAreaField, TextField } from '@/components/ui/FormField'
import {
  buildSchedulePayload,
  defaultCourseTimezone,
  parseClassMeetings,
  WEEKDAY_LABELS,
  type ClassMeeting,
} from '@/lib/classSchedule'
import type { CreateCourseRequest, UpdateCourseRequest } from '@/lib/api/types/course'

type CourseFormProps = {
  initialValues?: {
    name?: string
    description?: string | null
    schedule?: Record<string, unknown>
  }
  onSubmit: (data: CreateCourseRequest | UpdateCourseRequest) => void
  onCancel: () => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function CourseForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save',
}: CourseFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [timezone, setTimezone] = useState(() => {
    const s = initialValues?.schedule?.timezone
    return typeof s === 'string' && s.trim() ? s.trim() : defaultCourseTimezone()
  })
  const [meetings, setMeetings] = useState<ClassMeeting[]>(() =>
    parseClassMeetings(initialValues?.schedule as Record<string, unknown> | undefined),
  )

  const addMeeting = () => {
    setMeetings((prev) => [...prev, { weekday: 0, start: '09:00', end: '10:00' }])
  }

  const removeMeeting = (index: number) => {
    setMeetings((prev) => prev.filter((_, i) => i !== index))
  }

  const updateMeeting = (index: number, patch: Partial<ClassMeeting>) => {
    setMeetings((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      schedule: buildSchedulePayload(meetings, timezone),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField
        id="course-name"
        label="Course name"
        required
        minLength={2}
        maxLength={200}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., CS 101 — Discrete Structures"
      />
      <TextAreaField
        id="course-description"
        label="Description (optional)"
        rows={3}
        maxLength={1000}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Brief course description..."
      />

      <fieldset className="border-divider rounded-[var(--radius-sm)] border p-3">
        <legend className="text-foreground px-1 text-sm font-medium">Class meeting times</legend>
        <p className="text-foreground/70 mb-3 text-xs">
          Used to validate Tempo live times. Weekdays follow Monday=0 … Sunday=6 (same as the server). Times are
          checked in the timezone below.
        </p>
        <TextField
          id="course-tz"
          label="Timezone (IANA)"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="e.g. America/Los_Angeles"
        />
        <ul className="mt-3 space-y-3">
          {meetings.map((m, i) => (
            <li
              key={`${i}-${m.weekday}-${m.start}-${m.end}`}
              className="border-divider flex flex-col gap-2 rounded-[var(--radius-sm)] border p-2 sm:flex-row sm:flex-wrap sm:items-end"
            >
              <div className="min-w-[10rem] flex-1">
                <label className="text-foreground/80 mb-1 block text-xs" htmlFor={`wd-${i}`}>
                  Day
                </label>
                <select
                  id={`wd-${i}`}
                  className="border-divider bg-surface w-full rounded-[var(--radius-sm)] border px-2 py-2 text-sm"
                  value={m.weekday}
                  onChange={(e) => updateMeeting(i, { weekday: parseInt(e.target.value, 10) })}
                >
                  {WEEKDAY_LABELS.map((label, value) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <TextField
                id={`st-${i}`}
                label="Start"
                type="time"
                value={m.start}
                onChange={(e) => updateMeeting(i, { start: e.target.value })}
              />
              <TextField
                id={`en-${i}`}
                label="End"
                type="time"
                value={m.end}
                onChange={(e) => updateMeeting(i, { end: e.target.value })}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeMeeting(i)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={addMeeting}>
          Add meeting
        </Button>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
