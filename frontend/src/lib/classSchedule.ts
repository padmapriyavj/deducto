/**
 * Course ``schedule.class_meetings`` (Python weekday: Monday=0 … Sunday=6)
 * and helpers for Tempo scheduling in the browser local timezone.
 */

export const WEEKDAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export type ClassMeeting = {
  weekday: number
  start: string
  end: string
}

export function defaultCourseTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function parseClassMeetings(schedule: Record<string, unknown> | undefined): ClassMeeting[] {
  if (!schedule) return []
  const raw = schedule.class_meetings
  if (!Array.isArray(raw)) return []
  const out: ClassMeeting[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const w = typeof o.weekday === 'number' ? o.weekday : parseInt(String(o.weekday ?? ''), 10)
    if (Number.isNaN(w) || w < 0 || w > 6) continue
    out.push({
      weekday: w,
      start: String(o.start ?? '09:00').slice(0, 5),
      end: String(o.end ?? '10:00').slice(0, 5),
    })
  }
  return out
}

export function buildSchedulePayload(
  meetings: ClassMeeting[],
  timezone: string,
): Record<string, unknown> {
  return {
    timezone: timezone.trim() || 'UTC',
    class_meetings: meetings.filter((m) => m.start && m.end),
  }
}

/** Map ``Date.getDay()`` (Sun=0 … Sat=6) to Python ``weekday()`` (Mon=0 … Sun=6). */
export function jsDayToPythonWeekday(jsDay: number): number {
  return (jsDay + 6) % 7
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

export function toYmdLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function toHmLocal(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map((x) => parseInt(x, 10))
  if (Number.isNaN(h)) return 0
  return h * 60 + (Number.isNaN(m) ? 0 : m)
}

/** Whether ``when`` (interpreted in the user's local timezone) lies in any meeting window. */
export function isLocalDateTimeWithinMeetings(when: Date, meetings: ClassMeeting[]): boolean {
  if (meetings.length === 0) return true
  const pyWd = jsDayToPythonWeekday(when.getDay())
  const hm = when.getHours() * 60 + when.getMinutes()
  for (const m of meetings) {
    if (m.weekday !== pyWd) continue
    const startM = hmToMinutes(m.start)
    const endM = hmToMinutes(m.end)
    if (startM <= hm && hm <= endM) return true
  }
  return false
}

/** Earliest upcoming slot at ``meeting.start`` local time, within the next 28 days. */
export function suggestNextTempoSlotLocal(
  meetings: ClassMeeting[],
  from: Date = new Date(),
): { date: string; time: string } | null {
  if (meetings.length === 0) return null
  for (let d = 0; d < 28; d += 1) {
    const cur = new Date(from.getFullYear(), from.getMonth(), from.getDate() + d, 0, 0, 0, 0)
    const pyWd = jsDayToPythonWeekday(cur.getDay())
    let best: Date | null = null
    for (const m of meetings) {
      if (m.weekday !== pyWd) continue
      const cand = new Date(cur)
      const [h, mi] = m.start.split(':').map((x) => parseInt(x, 10))
      cand.setHours(Number.isNaN(h) ? 0 : h, Number.isNaN(mi) ? 0 : mi, 0, 0)
      if (cand > from && (!best || cand < best)) best = cand
    }
    if (best) return { date: toYmdLocal(best), time: toHmLocal(best) }
  }
  return null
}
