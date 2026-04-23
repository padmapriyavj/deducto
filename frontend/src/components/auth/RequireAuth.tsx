import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuthStore } from '@/stores/authStore'

type Role = 'student' | 'professor'

export function RequireAuth({
  allowedRoles,
  children,
}: {
  allowedRoles?: Role[]
  children?: ReactNode
}) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const location = useLocation()

  // Don't redirect until initialization is complete
  // (AuthInitializer should handle this, but this is a safety check)
  if (!isInitialized) {
    return null
  }

  if (!token || !user) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  if (allowedRoles?.length && user.role && !allowedRoles.includes(user.role as Role)) {
    return <Navigate to="/" replace />
  }

  return children ?? <Outlet />
}
