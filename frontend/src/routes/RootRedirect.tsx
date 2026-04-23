import { Navigate } from 'react-router'

import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/authStore'

/** `/` — no marketing home; send users to their dashboard or login. */
export function RootRedirect() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const isInitialized = useAuthStore((s) => s.isInitialized)

  if (!isInitialized) {
    return <Spinner label="Loading..." />
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'professor') {
    return <Navigate to="/professor" replace />
  }

  return <Navigate to="/student" replace />
}
