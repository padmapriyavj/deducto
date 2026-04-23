/**
 * Client-side notifications until platform notification APIs exist.
 * Lessons, materials, and Tempos are served from the backend APIs.
 */

export type LocalNotification = {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
  type: 'tempo' | 'system'
}

const KEY = 'deductible:courseContent:v1'

type Store = {
  notifications: LocalNotification[]
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { notifications: [] }
    const p = JSON.parse(raw) as {
      notifications?: LocalNotification[]
      /** legacy */
      tempos?: unknown[]
      materials?: unknown[]
      lessons?: unknown[]
    }
    const notifications = Array.isArray(p.notifications) ? p.notifications : []
    return { notifications }
  } catch {
    return { notifications: [] }
  }
}

function save(s: Store) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function listNotifications(): LocalNotification[] {
  return load().notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function addNotification(n: Omit<LocalNotification, 'id' | 'createdAt' | 'read'>) {
  const s = load()
  const row: LocalNotification = {
    ...n,
    id: crypto.randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
  }
  s.notifications.unshift(row)
  save(s)
  return row
}

export function markNotificationRead(id: string) {
  const s = load()
  const n = s.notifications.find((x) => x.id === id)
  if (n) n.read = true
  save(s)
}
