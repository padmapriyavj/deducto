import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/ui/PageContainer'
import { useAuthStore } from '@/stores/authStore'

export function NotFoundPage() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  const dashboard =
    token && user
      ? user.role === 'professor'
        ? '/professor'
        : '/student'
      : null

  return (
    <PageContainer narrow centered className="text-center">
      <Card padding="lg" className="mx-auto">
        <p className="text-primary/90 font-heading mb-2 text-5xl font-semibold leading-none sm:text-6xl">
          404
        </p>
        <h1 className="text-foreground mb-3 text-2xl sm:text-3xl">Page not found</h1>
        <p className="text-foreground/75 mx-auto mb-8 max-w-sm text-sm leading-relaxed sm:text-base">
          That URL does not match anything here. Check the link or go back to your dashboard.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {dashboard ? (
            <>
              <Button fullWidth className="sm:w-auto sm:min-w-[12rem]" onClick={() => navigate(dashboard)}>
                Go to dashboard
              </Button>
              <Button
                variant="ghost"
                fullWidth
                className="sm:w-auto"
                onClick={() => navigate('/login')}
              >
                Log in as someone else
              </Button>
            </>
          ) : (
            <Button fullWidth className="sm:mx-auto sm:max-w-xs" onClick={() => navigate('/login')}>
              Log in
            </Button>
          )}
        </div>
      </Card>
    </PageContainer>
  )
}
