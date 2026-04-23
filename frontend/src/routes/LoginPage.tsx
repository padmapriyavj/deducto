import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/FormField'
import { PageContainer } from '@/components/ui/PageContainer'
import { Spinner } from '@/components/ui/Spinner'
import { loginRequest } from '@/lib/authApi'
import { useAuthStore } from '@/stores/authStore'

function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message)
      return parsed.detail || error.message
    } catch {
      return error.message
    }
  }
  return 'Something went wrong. Please try again.'
}

export function LoginPage() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const login = useMutation({
    mutationFn: () => loginRequest({ email, password }),
    onSuccess: (data) => {
      setAuth(data.access_token, data.user)
      const fallback = data.user.role === 'professor' ? '/professor' : '/student'
      const target =
        from && from !== '/login' && from !== '/signup' ? from : fallback
      navigate(target, { replace: true })
    },
  })

  if (!isInitialized) {
    return <Spinner label="Loading..." />
  }

  if (token && role) {
    return <Navigate to={role === 'professor' ? '/professor' : '/student'} replace />
  }

  return (
    <PageContainer narrow centered>
      <Card padding="lg" className="mx-auto">
        <h1 className="mb-1 text-2xl sm:text-3xl">Log in</h1>
        <p className="text-foreground/70 mb-6 text-sm sm:text-base">
          Sign in to your account to access your dashboard.
        </p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            login.mutate()
          }}
        >
          <TextField
            id="login-email"
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            id="login-password"
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {login.isError ? (
            <p className="text-danger text-sm" role="alert">
              {parseApiError(login.error)}
            </p>
          ) : null}
          <Button type="submit" fullWidth disabled={login.isPending}>
            {login.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="text-foreground/70 mt-6 text-center text-sm">
          No account?{' '}
          <Link to="/signup" className="text-primary font-medium underline-offset-2 hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </PageContainer>
  )
}
