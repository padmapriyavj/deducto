import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'

import { AvatarImg } from '@/components/ui/AvatarImg'
import { useAuthStore } from '@/stores/authStore'
import type { UserPublic } from '@/stores/authStore'
import { useStudentEconomyStore } from '@/stores/studentEconomyStore'

const navLinkClass =
  'rounded-[var(--radius-sm)] px-3 py-3 text-sm font-medium text-secondary transition-colors hover:bg-background hover:text-primary md:py-2'

const navLinkActive = 'bg-background text-primary ring-1 ring-divider/80'

function mergeNavClass({ isActive }: { isActive: boolean }) {
  return `${navLinkClass} ${isActive ? navLinkActive : ''}`.trim()
}

const menuItemClass =
  'text-foreground hover:bg-background block w-full rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-sm font-medium'

function userInitials(u: UserPublic): string {
  const name = u.display_name?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  const e = u.email?.trim()
  if (e && e.length >= 2) return e.slice(0, 2).toUpperCase()
  return '?'
}

export function AppShell() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const coins = useStudentEconomyStore((s) => s.coins)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const location = useLocation()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const streakDays = user?.current_streak ?? 0

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!dropdownOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false)
    }
    const onPointer = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [dropdownOpen])

  const brandTo =
    token && user ? (user.role === 'student' ? '/student' : '/professor') : '/login'

  const studentPrimaryLinks = (
    <>
      <NavLink to="/student" end className={mergeNavClass}>
        Dashboard
      </NavLink>
      <NavLink to="/student/practice" className={mergeNavClass}>
        Practice
      </NavLink>
    </>
  )

  const professorPrimaryLinks = (
    <NavLink to="/professor" end className={mergeNavClass}>
      Dashboard
    </NavLink>
  )

  const accountMenuId = 'account-menu'

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="border-divider bg-surface/90 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            to={brandTo}
            className="font-heading text-foreground min-w-0 shrink-0 text-lg tracking-tight sm:text-xl"
          >
            🦊 Deducto 
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex md:flex-wrap md:justify-end">
            {token && user ? (
              <>
                <nav className="text-foreground/85 flex flex-wrap items-center gap-1" aria-label="Primary">
                  {user.role === 'student' ? studentPrimaryLinks : professorPrimaryLinks}
                </nav>
                {user.role === 'student' ? (
                  <div className="mx-2 flex items-center gap-3">
                    <div className="bg-background/60 flex items-center gap-1.5 rounded-full px-2.5 py-1" title={`${streakDays} day streak`}>
                      <span className="text-base">🔥</span>
                      <span className="text-foreground font-mono text-sm font-semibold">{streakDays}</span>
                    </div>
                    <div className="bg-background/60 flex items-center gap-1.5 rounded-full px-2.5 py-1" title={`${coins} coins`}>
                      <span className="text-base">🪙</span>
                      <span className="text-gold font-mono text-sm font-semibold">{coins}</span>
                    </div>
                  </div>
                ) : null}
                
                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    className="ring-divider/60 hover:ring-divider focus-visible:ring-secondary inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-0.5 ring-2 transition-shadow focus-visible:ring-2 focus-visible:outline-none"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                    aria-controls={accountMenuId}
                    aria-label={`Account menu for ${user.display_name ?? user.email}`}
                    onClick={() => setDropdownOpen((o) => !o)}
                  >
                    <AvatarImg
                      user={{ id: user.id, email: user.email }}
                      fallbackInitials={userInitials(user)}
                      size="sm"
                      className="ring-0"
                    />
                  </button>
                  {dropdownOpen ? (
                    <div
                      id={accountMenuId}
                      role="menu"
                      className="border-divider bg-surface absolute right-0 z-40 mt-2 min-w-[12rem] rounded-[var(--radius-sm)] border py-1 shadow-lg"
                    >
                      <div className="border-divider/60 text-foreground/80 border-b px-3 py-2 text-xs">
                        <p className="font-medium text-foreground">{user.display_name ?? 'Account'}</p>
                        <p className="truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/settings"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={() => setDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                      {user.role === 'student' ? (
                        <>
                          <Link
                            to="/student/space"
                            role="menuitem"
                            className={menuItemClass}
                            onClick={() => setDropdownOpen(false)}
                          >
                            Space
                          </Link>
                          <Link
                            to="/student/shop"
                            role="menuitem"
                            className={menuItemClass}
                            onClick={() => setDropdownOpen(false)}
                          >
                            Store
                          </Link>
                        </>
                      ) : null}
                      <button
                        type="button"
                        role="menuitem"
                        className={`${menuItemClass} text-danger hover:bg-danger/5`}
                        onClick={() => {
                          setDropdownOpen(false)
                          clearAuth()
                        }}
                      >
                        Log out
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <nav className="text-foreground/85 flex items-center gap-1">
                <NavLink to="/login" className={mergeNavClass}>
                  Log in
                </NavLink>
                <NavLink to="/signup" className={mergeNavClass}>
                  Sign up
                </NavLink>
              </nav>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="border-divider text-foreground hover:bg-background flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] border md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <span aria-hidden className="flex flex-col gap-1.5">
              <span
                className={`bg-foreground block h-0.5 w-5 origin-center transition-transform ${menuOpen ? 'translate-y-2 rotate-45' : ''}`}
              />
              <span className={`bg-foreground block h-0.5 w-5 ${menuOpen ? 'opacity-0' : ''}`} />
              <span
                className={`bg-foreground block h-0.5 w-5 origin-center transition-transform ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile flyout */}
      {menuOpen ? (
        <div
          id="mobile-nav"
          className="border-divider bg-surface fixed inset-x-0 top-[3.25rem] z-20 flex max-h-[calc(100svh-3.25rem)] flex-col overflow-y-auto border-b p-4 shadow-lg md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {token && user ? (
              <>
                <div className="border-divider/60 mb-3 flex items-center gap-3 border-b pb-3">
                  <AvatarImg
                    user={{ id: user.id, email: user.email }}
                    fallbackInitials={userInitials(user)}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{user.display_name ?? 'Account'}</p>
                    <p className="text-foreground/60 truncate text-xs">{user.email}</p>
                  </div>
                  {user.role === 'student' ? (
                    <div className="flex items-center gap-2">
                      <div className="bg-background/60 flex items-center gap-1 rounded-full px-2 py-0.5" title={`${streakDays} day streak`}>
                        <span className="text-sm">🔥</span>
                        <span className="text-foreground font-mono text-xs font-semibold">{streakDays}</span>
                      </div>
                      <div className="bg-background/60 flex items-center gap-1 rounded-full px-2 py-0.5" title={`${coins} coins`}>
                        <span className="text-sm">🪙</span>
                        <span className="text-gold font-mono text-xs font-semibold">{coins}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
                <p className="text-foreground/50 mb-1 text-xs font-semibold uppercase tracking-wide">
                  Navigate
                </p>
                <div className="mb-3 flex flex-col gap-1">
                  {user.role === 'student' ? (
                    <>
                      <NavLink to="/student" end className={mergeNavClass} onClick={() => setMenuOpen(false)}>
                        Dashboard
                      </NavLink>
                      <NavLink
                        to="/student/practice"
                        className={mergeNavClass}
                        onClick={() => setMenuOpen(false)}
                      >
                        Practice
                      </NavLink>
                    </>
                  ) : (
                    <NavLink to="/professor" end className={mergeNavClass} onClick={() => setMenuOpen(false)}>
                      Dashboard
                    </NavLink>
                  )}
                </div>
                <p className="text-foreground/50 mb-1 text-xs font-semibold uppercase tracking-wide">
                  Account
                </p>
                <NavLink to="/settings" className={mergeNavClass} onClick={() => setMenuOpen(false)}>
                  Profile
                </NavLink>
                {user.role === 'student' ? (
                  <>
                    <NavLink to="/student/space" className={mergeNavClass} onClick={() => setMenuOpen(false)}>
                      Space
                    </NavLink>
                    <NavLink to="/student/shop" className={mergeNavClass} onClick={() => setMenuOpen(false)}>
                      Store
                    </NavLink>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => clearAuth()}
                  className="text-danger hover:bg-danger/5 mt-2 rounded-[var(--radius-sm)] px-3 py-3 text-left text-sm font-medium"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={mergeNavClass} onClick={() => setMenuOpen(false)}>
                  Log in
                </NavLink>
                <NavLink to="/signup" className={mergeNavClass} onClick={() => setMenuOpen(false)}>
                  Sign up
                </NavLink>
              </>
            )}
          </nav>
        </div>
      ) : null}

      {menuOpen ? (
        <button
          type="button"
          className="bg-foreground/20 fixed inset-0 z-10 md:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
