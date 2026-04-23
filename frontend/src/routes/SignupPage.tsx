import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/FormField'
import { PageContainer } from '@/components/ui/PageContainer'
import { Spinner } from '@/components/ui/Spinner'
import { signupRequest } from '@/lib/authApi'
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

export function SignupPage() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [accountRole, setAccountRole] = useState<'student' | 'professor'>('student')

  const signup = useMutation({
    mutationFn: () =>
      signupRequest({
        email,
        password,
        display_name: displayName,
        role: accountRole,
      }),
    onSuccess: (data) => {
      setAuth(data.access_token, data.user)
      const studentJoin =
        data.user.role === 'student' &&
        from &&
        from.startsWith('/join/') &&
        from !== '/login' &&
        from !== '/signup'
      const target = studentJoin
        ? from
        : data.user.role === 'professor'
          ? '/professor'
          : '/student'
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
        <h1 className="mb-1 text-2xl sm:text-3xl">Sign up</h1>
        <p className="text-foreground/70 mb-6 text-sm sm:text-base">Create an account to get started.</p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            signup.mutate()
          }}
        >
          <TextField
            id="signup-name"
            label="Display name"
            name="displayName"
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <TextField
            id="signup-email"
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            id="signup-password"
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="At least 6 characters."
          />
          <fieldset className="space-y-2">
            <legend className="text-foreground mb-1 text-sm font-medium">I am a</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label
                className={`border-divider/60 hover:bg-background/80 flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-2 ${
                  accountRole === 'student' ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={accountRole === 'student'}
                  onChange={() => setAccountRole('student')}
                  className="text-primary"
                />
                Student
              </label>
              <label
                className={`border-divider/60 hover:bg-background/80 flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-2 ${
                  accountRole === 'professor' ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="professor"
                  checked={accountRole === 'professor'}
                  onChange={() => setAccountRole('professor')}
                  className="text-primary"
                />
                Professor
              </label>
            </div>
          </fieldset>
          {signup.isError ? (
            <p className="text-danger text-sm" role="alert">
              {parseApiError(signup.error)}
            </p>
          ) : null}
          <Button type="submit" fullWidth disabled={signup.isPending}>
            {signup.isPending ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <p className="text-foreground/70 mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium underline-offset-2 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </PageContainer>
  )
}
